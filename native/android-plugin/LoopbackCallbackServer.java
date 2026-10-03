package com.moldavite.mrdarkness;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URI;
import java.nio.charset.StandardCharsets;

final class LoopbackCallbackServer implements AutoCloseable {
    private final ServerSocket server;
    private final String callbackPath;

    LoopbackCallbackServer(String callbackPath) throws Exception {
        this.callbackPath = callbackPath;
        this.server = new ServerSocket();
        this.server.setReuseAddress(false);
        this.server.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), 0), 1);
    }

    int getPort() {
        return server.getLocalPort();
    }

    String getRedirectUri() {
        return "http://127.0.0.1:" + getPort() + callbackPath;
    }

    URI awaitCallback(int timeoutMs) throws Exception {
        server.setSoTimeout(timeoutMs);
        try (Socket socket = server.accept()) {
            socket.setSoTimeout(8000);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            String first = reader.readLine();
            if (first == null || !first.startsWith("GET ")) throw new IllegalStateException("Invalid OAuth callback request");
            String target = first.split(" ")[1];
            while (true) {
                String line = reader.readLine();
                if (line == null || line.isEmpty()) break;
            }

            String body = "<!doctype html><html><head><meta name=viewport content=\"width=device-width,initial-scale=1\"><title>Mr Darkness</title></head><body style=\"background:#080708;color:#eee;font-family:system-ui;padding:32px\"><h2>Mr Darkness connected.</h2><p>You can close this browser tab and return to the app.</p></body></html>";
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
            writer.write("HTTP/1.1 200 OK\r\n");
            writer.write("Content-Type: text/html; charset=utf-8\r\n");
            writer.write("Content-Length: " + bytes.length + "\r\n");
            writer.write("Cache-Control: no-store\r\n");
            writer.write("Connection: close\r\n\r\n");
            writer.flush();
            socket.getOutputStream().write(bytes);
            socket.getOutputStream().flush();

            return URI.create("http://127.0.0.1:" + getPort() + target);
        }
    }

    @Override
    public void close() {
        try { server.close(); } catch (Exception ignored) {}
    }
}
