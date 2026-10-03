package com.moldavite.mrdarkness;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.ConfigurableJWTProcessor;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;

import org.json.JSONArray;
import org.json.JSONObject;

import java.net.URI;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.ResponseBody;
import okio.BufferedSource;

@CapacitorPlugin(name = "ChatGPTPlan")
public class ChatGPTPlanPlugin extends Plugin {
    private static final String AUTH_URL = "https://auth.openai.com/api/accounts/authorize";
    private static final String TOKEN_URL = "https://auth.openai.com/api/accounts/oauth/token";
    private static final String REVOKE_URL = "https://auth.openai.com/api/accounts/oauth/revoke";
    private static final String JWKS_URL = "https://auth.openai.com/.well-known/jwks.json";
    private static final String ISSUER = "https://auth.openai.com";
    private static final String RESOURCE = "https://api.openai.com/v1";
    private static final String MODELS_URL = "https://api.openai.com/v1/models";
    private static final String RESPONSES_URL = "https://api.openai.com/v1/responses";
    private static final String SCOPE = "openid profile email offline_access resource.invoke chatgpt.tokens.use.direct";
    private static final String CALLBACK_PATH = "/auth/callback";
    private static final String PREF_FILE = "mr_darkness_chatgpt_credentials";
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");

    private final OkHttpClient http = new OkHttpClient.Builder().retryOnConnectionFailure(true).build();
    private final SecureRandom random = new SecureRandom();
    private final AtomicReference<Boolean> refreshing = new AtomicReference<>(false);
    private SharedPreferences prefs;

    @Override
    public void load() {
        try {
            MasterKey masterKey = new MasterKey.Builder(getContext())
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();
            prefs = EncryptedSharedPreferences.create(
                getContext(),
                PREF_FILE,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
            ensureHostId();
        } catch (Exception e) {
            throw new RuntimeException("Unable to initialize secure ChatGPT credential storage", e);
        }
    }

    @PluginMethod
    public void getStatus(PluginCall call) {
        JSObject out = new JSObject();
        out.put("available", true);
        out.put("connected", hasUsableSession());
        out.put("email", prefs.getString("email", ""));
        out.put("clientId", prefs.getString("client_id", ""));
        out.put("planSharing", prefs.getBoolean("plan_sharing", false));
        call.resolve(out);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        String agentName = call.getString("agentName", "Mr Darkness HQ");
        runAsync(call, () -> doSignIn(agentName));
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        runAsync(call, () -> {
            String refreshToken = prefs.getString("refresh_token", "");
            String clientId = prefs.getString("client_id", "");
            boolean revoked = false;
            if (!refreshToken.isEmpty() && !clientId.isEmpty()) {
                try {
                    FormBody body = new FormBody.Builder()
                        .add("token", refreshToken)
                        .add("token_type_hint", "refresh_token")
                        .add("client_id", clientId)
                        .build();
                    Request req = new Request.Builder().url(REVOKE_URL).post(body).build();
                    try (Response response = http.newCall(req).execute()) {
                        revoked = response.isSuccessful();
                    }
                } catch (Exception ignored) {}
            }
            prefs.edit()
                .remove("access_token")
                .remove("refresh_token")
                .remove("id_token")
                .remove("expires_at")
                .remove("scope")
                .putBoolean("plan_sharing", false)
                .apply();
            JSObject out = new JSObject();
            out.put("signedOut", true);
            out.put("revoked", revoked);
            return out;
        });
    }

    @PluginMethod
    public void listModels(PluginCall call) {
        runAsync(call, () -> {
            String access = ensureAccessToken();
            JSONArray models = fetchModelArray(access);
            JSArray result = new JSArray();
            for (int i = 0; i < models.length(); i++) {
                JSONObject item = models.optJSONObject(i);
                if (item == null) continue;
                String visibility = item.optString("visibility", "list");
                if (!"list".equals(visibility)) continue;
                JSObject m = new JSObject();
                m.put("slug", item.optString("slug", item.optString("id", "")));
                m.put("display_name", item.optString("display_name", item.optString("slug", item.optString("id", ""))));
                result.put(m);
            }
            JSObject out = new JSObject();
            out.put("models", result);
            return out;
        });
    }

    @PluginMethod
    public void respond(PluginCall call) {
        String requestedModel = call.getString("model", "");
        String instructions = call.getString("instructions", "");
        String input = call.getString("input", "");
        if (input == null || input.trim().isEmpty()) {
            call.reject("input is required");
            return;
        }
        runAsync(call, () -> doResponse(requestedModel, instructions, input));
    }

    private JSObject doSignIn(String agentName) throws Exception {
        String hostId = ensureHostId();
        String savedClientId = prefs.getString("client_id", "");
        String clientIdForAuth = savedClientId.isEmpty() ? "dynamic_agent_client" : savedClientId;
        String verifier = randomUrlSafe(64);
        String challenge = base64Url(MessageDigest.getInstance("SHA-256").digest(verifier.getBytes(StandardCharsets.US_ASCII)));
        String state = randomUrlSafe(32);
        String nonce = randomUrlSafe(32);

        try (LoopbackCallbackServer loopback = new LoopbackCallbackServer(CALLBACK_PATH)) {
            String redirectUri = loopback.getRedirectUri();
            HttpUrl.Builder auth = HttpUrl.parse(AUTH_URL).newBuilder()
                .addQueryParameter("client_id", clientIdForAuth)
                .addQueryParameter("ext_agent_host_id", hostId)
                .addQueryParameter("response_type", "code")
                .addQueryParameter("redirect_uri", redirectUri)
                .addQueryParameter("scope", SCOPE)
                .addQueryParameter("resource", RESOURCE)
                .addQueryParameter("state", state)
                .addQueryParameter("nonce", nonce)
                .addQueryParameter("code_challenge_method", "S256")
                .addQueryParameter("code_challenge", challenge);

            if (savedClientId.isEmpty()) {
                auth.addQueryParameter("agent_name_hint", agentName);
            } else {
                String idTokenHint = prefs.getString("id_token", "");
                String email = prefs.getString("email", "");
                if (!idTokenHint.isEmpty()) auth.addQueryParameter("id_token_hint", idTokenHint);
                if (!email.isEmpty()) auth.addQueryParameter("login_hint", email);
            }

            String authUrl = auth.build().toString();
            getActivity().runOnUiThread(() -> {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(authUrl));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(intent);
            });

            URI callback = loopback.awaitCallback(5 * 60 * 1000);
            Uri callbackUri = Uri.parse(callback.toString());
            String returnedState = callbackUri.getQueryParameter("state");
            if (!constantTimeEquals(state, returnedState)) throw new IllegalStateException("OAuth state mismatch");
            String error = callbackUri.getQueryParameter("error");
            if (error != null && !error.isEmpty()) throw new IllegalStateException("ChatGPT authorization was not completed: " + error);
            String code = callbackUri.getQueryParameter("code");
            if (code == null || code.isEmpty()) throw new IllegalStateException("OAuth callback did not include an authorization code");
            String issuedClientId = callbackUri.getQueryParameter("client_id");
            if (savedClientId.isEmpty()) {
                if (issuedClientId == null || issuedClientId.isEmpty()) throw new IllegalStateException("New registration did not return an issued client_id");
            } else {
                if (issuedClientId != null && !issuedClientId.isEmpty() && !savedClientId.equals(issuedClientId)) throw new IllegalStateException("OAuth returned a different client_id than the saved registration");
                issuedClientId = savedClientId;
            }

            JSONObject token = exchangeCode(issuedClientId, code, verifier, redirectUri);
            String idToken = token.optString("id_token", "");
            String accessToken = token.optString("access_token", "");
            String refreshToken = token.optString("refresh_token", "");
            String scope = token.optString("scope", callbackUri.getQueryParameter("scope"));
            if (idToken.isEmpty() || accessToken.isEmpty() || refreshToken.isEmpty()) throw new IllegalStateException("Token exchange returned an incomplete credential set");
            if (scope == null || !scope.contains("chatgpt.tokens.use.direct")) throw new IllegalStateException("ChatGPT plan usage was not authorized for this app");

            JWTClaimsSet claims = validateIdToken(idToken, issuedClientId, nonce);
            String subject = claims.getSubject();
            String existingSubject = prefs.getString("subject", "");
            if (!savedClientId.isEmpty() && !existingSubject.isEmpty() && !existingSubject.equals(subject)) {
                throw new IllegalStateException("Signed-in ChatGPT identity does not match the saved registration");
            }
            String email = stringClaim(claims, "email");
            long expiresIn = token.optLong("expires_in", 3600);
            saveCredentials(issuedClientId, subject, email, idToken, accessToken, refreshToken, scope, expiresIn);

            JSObject out = new JSObject();
            out.put("connected", true);
            out.put("email", email);
            out.put("clientId", issuedClientId);
            out.put("planSharing", true);
            return out;
        }
    }

    private JSONObject exchangeCode(String clientId, String code, String verifier, String redirectUri) throws Exception {
        FormBody body = new FormBody.Builder()
            .add("grant_type", "authorization_code")
            .add("client_id", clientId)
            .add("code", code)
            .add("code_verifier", verifier)
            .add("redirect_uri", redirectUri)
            .add("resource", RESOURCE)
            .build();
        Request req = new Request.Builder().url(TOKEN_URL).post(body).build();
        try (Response response = http.newCall(req).execute()) {
            String raw = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) throw new IllegalStateException("Token exchange failed (" + response.code() + ")");
            return new JSONObject(raw);
        }
    }

    private JWTClaimsSet validateIdToken(String idToken, String clientId, String nonce) throws Exception {
        JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(JWKS_URL));
        ConfigurableJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
        JWSKeySelector<SecurityContext> selector = new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
        processor.setJWSKeySelector(selector);
        JWTClaimsSet claims = processor.process(idToken, null);
        if (!ISSUER.equals(claims.getIssuer())) throw new IllegalStateException("ID token issuer is invalid");
        List<String> audience = claims.getAudience();
        if (audience == null || !audience.contains(clientId)) throw new IllegalStateException("ID token audience is invalid");
        Date exp = claims.getExpirationTime();
        if (exp == null || exp.before(new Date())) throw new IllegalStateException("ID token is expired");
        String returnedNonce = stringClaim(claims, "nonce");
        if (!constantTimeEquals(nonce, returnedNonce)) throw new IllegalStateException("ID token nonce is invalid");
        if (claims.getSubject() == null || claims.getSubject().isEmpty()) throw new IllegalStateException("ID token subject is missing");
        return claims;
    }

    private String ensureAccessToken() throws Exception {
        if (!prefs.getBoolean("plan_sharing", false)) throw new IllegalStateException("ChatGPT plan is not connected");
        long expiresAt = prefs.getLong("expires_at", 0L);
        String token = prefs.getString("access_token", "");
        if (!token.isEmpty() && System.currentTimeMillis() < expiresAt - 120_000L) return token;
        synchronized (refreshing) {
            expiresAt = prefs.getLong("expires_at", 0L);
            token = prefs.getString("access_token", "");
            if (!token.isEmpty() && System.currentTimeMillis() < expiresAt - 120_000L) return token;
            return refreshAccessToken();
        }
    }

    private String refreshAccessToken() throws Exception {
        String refresh = prefs.getString("refresh_token", "");
        String clientId = prefs.getString("client_id", "");
        if (refresh.isEmpty() || clientId.isEmpty()) throw new IllegalStateException("ChatGPT session must be authorized again");
        FormBody body = new FormBody.Builder()
            .add("grant_type", "refresh_token")
            .add("client_id", clientId)
            .add("refresh_token", refresh)
            .add("resource", RESOURCE)
            .build();
        Request req = new Request.Builder().url(TOKEN_URL).post(body).build();
        try (Response response = http.newCall(req).execute()) {
            String raw = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) throw new IllegalStateException("ChatGPT session refresh failed (" + response.code() + ")");
            JSONObject token = new JSONObject(raw);
            String access = token.optString("access_token", "");
            String rotatedRefresh = token.optString("refresh_token", "");
            if (access.isEmpty() || rotatedRefresh.isEmpty()) throw new IllegalStateException("Refresh returned incomplete credentials");
            String idToken = token.optString("id_token", prefs.getString("id_token", ""));
            String scope = token.optString("scope", prefs.getString("scope", ""));
            long expiresIn = token.optLong("expires_in", 3600);
            prefs.edit()
                .putString("access_token", access)
                .putString("refresh_token", rotatedRefresh)
                .putString("id_token", idToken)
                .putString("scope", scope)
                .putLong("expires_at", System.currentTimeMillis() + expiresIn * 1000L)
                .putBoolean("plan_sharing", scope.contains("chatgpt.tokens.use.direct"))
                .apply();
            return access;
        }
    }

    private JSONArray fetchModelArray(String access) throws Exception {
        Request req = new Request.Builder()
            .url(MODELS_URL)
            .header("Authorization", "Bearer " + access)
            .get()
            .build();
        try (Response response = http.newCall(req).execute()) {
            String raw = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) throw new IllegalStateException("Model list failed (" + response.code() + ")");
            JSONObject parsed = new JSONObject(raw);
            JSONArray models = parsed.optJSONArray("models");
            if (models == null) models = parsed.optJSONArray("data");
            return models != null ? models : new JSONArray();
        }
    }

    private String chooseDefaultModel(String access) throws Exception {
        JSONArray models = fetchModelArray(access);
        for (int i = 0; i < models.length(); i++) {
            JSONObject item = models.optJSONObject(i);
            if (item == null) continue;
            if (!"list".equals(item.optString("visibility", "list"))) continue;
            String slug = item.optString("slug", item.optString("id", ""));
            if (!slug.isEmpty()) return slug;
        }
        throw new IllegalStateException("No ChatGPT-plan model is currently available to this account");
    }

    private JSObject doResponse(String requestedModel, String instructions, String input) throws Exception {
        String access = ensureAccessToken();
        String model = requestedModel == null || requestedModel.isEmpty() ? chooseDefaultModel(access) : requestedModel;
        JSONObject payload = new JSONObject();
        payload.put("model", model);
        if (instructions != null && !instructions.isEmpty()) payload.put("instructions", instructions);
        payload.put("input", input);
        payload.put("store", false);
        payload.put("stream", true);

        Request req = new Request.Builder()
            .url(RESPONSES_URL)
            .header("Authorization", "Bearer " + access)
            .header("Content-Type", "application/json")
            .post(RequestBody.create(payload.toString(), JSON))
            .build();

        StringBuilder text = new StringBuilder();
        String responseModel = model;
        try (Response response = http.newCall(req).execute()) {
            if (!response.isSuccessful()) {
                String raw = response.body() != null ? response.body().string() : "";
                String message = "ChatGPT request failed (" + response.code() + ")";
                try {
                    JSONObject err = new JSONObject(raw).optJSONObject("error");
                    if (err != null && !err.optString("message", "").isEmpty()) message += ": " + err.optString("message");
                } catch (Exception ignored) {}
                throw new IllegalStateException(message);
            }
            ResponseBody body = response.body();
            if (body == null) throw new IllegalStateException("ChatGPT returned an empty stream");
            BufferedSource source = body.source();
            while (!source.exhausted()) {
                String line = source.readUtf8Line();
                if (line == null || !line.startsWith("data:")) continue;
                String data = line.substring(5).trim();
                if (data.isEmpty() || "[DONE]".equals(data)) continue;
                JSONObject event;
                try { event = new JSONObject(data); } catch (Exception ignored) { continue; }
                String type = event.optString("type", "");
                if ("response.output_text.delta".equals(type)) {
                    text.append(event.optString("delta", ""));
                } else if ("response.completed".equals(type)) {
                    JSONObject r = event.optJSONObject("response");
                    if (r != null && !r.optString("model", "").isEmpty()) responseModel = r.optString("model");
                    break;
                } else if ("response.failed".equals(type)) {
                    JSONObject r = event.optJSONObject("response");
                    JSONObject error = r != null ? r.optJSONObject("error") : null;
                    throw new IllegalStateException(error != null ? error.optString("message", "ChatGPT response failed") : "ChatGPT response failed");
                }
            }
        }
        if (text.length() == 0) throw new IllegalStateException("ChatGPT completed without text output");
        JSObject out = new JSObject();
        out.put("text", text.toString());
        out.put("model", responseModel);
        return out;
    }

    private void saveCredentials(String clientId, String subject, String email, String idToken, String accessToken, String refreshToken, String scope, long expiresIn) {
        prefs.edit()
            .putString("client_id", clientId)
            .putString("subject", subject)
            .putString("email", email == null ? "" : email)
            .putString("id_token", idToken)
            .putString("access_token", accessToken)
            .putString("refresh_token", refreshToken)
            .putString("scope", scope == null ? "" : scope)
            .putLong("expires_at", System.currentTimeMillis() + expiresIn * 1000L)
            .putBoolean("plan_sharing", scope != null && scope.contains("chatgpt.tokens.use.direct"))
            .apply();
    }

    private boolean hasUsableSession() {
        return prefs != null && prefs.getBoolean("plan_sharing", false) && !prefs.getString("refresh_token", "").isEmpty();
    }

    private String ensureHostId() {
        String id = prefs != null ? prefs.getString("host_id", "") : "";
        if (id == null || id.isEmpty()) {
            id = "urn:uuid:" + UUID.randomUUID();
            if (prefs != null) prefs.edit().putString("host_id", id).apply();
        }
        return id;
    }

    private String randomUrlSafe(int bytes) {
        byte[] data = new byte[bytes];
        random.nextBytes(data);
        return base64Url(data);
    }

    private String base64Url(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) return false;
        return MessageDigest.isEqual(a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }

    private String stringClaim(JWTClaimsSet claims, String name) {
        try {
            String value = claims.getStringClaim(name);
            return value == null ? "" : value;
        } catch (Exception e) {
            return "";
        }
    }

    private interface Job { JSObject run() throws Exception; }

    private void runAsync(PluginCall call, Job job) {
        new Thread(() -> {
            try {
                call.resolve(job.run());
            } catch (Exception e) {
                call.reject(e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
            }
        }, "MrDarkness-ChatGPT").start();
    }
}
