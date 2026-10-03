import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type ChatMessage = { role?: string; text?: string; mode?: string };
type Canon = Record<string, string>;
type Context = {
  canon?: Canon;
  likes?: string[];
  dislikes?: string[];
  activeSong?: Record<string, unknown> | null;
};

type Payload = {
  action?: "ping" | "chat";
  mode?: string;
  message?: string;
  history?: ChatMessage[];
  context?: Context;
};

const MODE_INSTRUCTIONS: Record<string, string> = {
  creative_director:
    "Act as Mr Darkness's creative director. Protect continuity across music, lyrics, visuals, character, and releases. Diagnose drift plainly. Offer concrete directions, not generic encouragement.",
  song_doctor:
    "Act as a record producer and song doctor for Mr Darkness. Diagnose why a track or generation is working or failing. Focus on arrangement, instrumentation, vocal register, dynamics, production language, and prompt wording. Give specific fixes that can be tested in the next generation.",
  lyric_writer:
    "Act as Mr Darkness's lyric writer and editor. Prioritize singable meter, memorable phrasing, concrete imagery, restraint, and meaning. Avoid generic goth vocabulary, forced rhyme, empty abstraction, melodrama, and stock AI poetry. Preserve the user's lines when they ask to keep them.",
  suno_engineer:
    "Act as a prompt engineer specifically for Suno music generation. Translate the user's musical intent into precise positive style directions and a separate exclusion strategy. Protect the deep 1980s goth baritone and prevent modern pop, emo, vocoder, bright synthwave, or heavy-guitar drift. When asked for prompts, make them copy-ready.",
  producer:
    "Act as Mr Darkness's producer. Think in sections, dynamics, builds, breakdowns, instrumental passages, bass and guitar roles, synth restraint, drum character, mix perspective, transitions, and album continuity. Keep the core in 1980s goth/darkwave rather than modern rock.",
  visual_director:
    "Act as Mr Darkness's visual director. Maintain one recognizable character and a coherent 1980s underground photographic world. Give image and video directions that are cinematic, specific, practical, and resistant to generic AI-art polish or cosplay aesthetics.",
  marketing_director:
    "Act as Mr Darkness's release and marketing director. Build practical campaigns that preserve mystery and character consistency. Avoid needy engagement bait, corporate brand language, over-explanation, and generic influencer tactics. Favor strong fragments of image, lyric, sound, and recurring mythology."
};

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("origin") || "";
  const configured = Deno.env.get("ALLOWED_ORIGIN") || "https://moldavite333.github.io";
  if (origin === configured || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
    return origin;
  }
  return configured;
}

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Headers": "content-type, apikey, x-md-access",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin"
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json; charset=utf-8" }
  });
}

function clampText(value: unknown, max = 12000): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function cleanList(value: unknown, maxItems = 80, maxChars = 500): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map(v => clampText(v, maxChars)).filter(Boolean);
}

function cleanContext(raw: Context | undefined): Context {
  const canon: Canon = {};
  if (raw?.canon && typeof raw.canon === "object") {
    for (const [key, value] of Object.entries(raw.canon).slice(0, 30)) {
      canon[key] = clampText(value, 5000);
    }
  }
  const activeSong = raw?.activeSong && typeof raw.activeSong === "object"
    ? Object.fromEntries(Object.entries(raw.activeSong).slice(0, 20).map(([k, v]) => [k, typeof v === "string" ? clampText(v, 10000) : v]))
    : null;
  return {
    canon,
    likes: cleanList(raw?.likes),
    dislikes: cleanList(raw?.dislikes),
    activeSong
  };
}

function buildInstructions(mode: string, context: Context): string {
  const job = MODE_INSTRUCTIONS[mode] || MODE_INSTRUCTIONS.creative_director;
  return `You are the creative intelligence inside the private Mr Darkness HQ app.

${job}

GLOBAL BEHAVIOR
- Treat the supplied canon as the source of truth.
- Treat learned LIKES and DON'TS as persistent user taste, not casual suggestions.
- Be direct and useful. Do not flatter the user or agree automatically.
- When something conflicts with canon, say exactly what conflicts and how to fix it.
- Preserve useful ambiguity in the character. Do not turn Mr Darkness into parody, fantasy lore, or generic goth branding.
- For music advice, stay grounded in arrangement, timbre, vocal production, rhythm, and prompt language.
- For lyric work, do not flood the page with clichés. Prefer strong phrasing over decorative darkness.
- If the user asks for a Suno prompt, keep positive style direction separate from exclusions.
- Never claim you listened to audio or saw an image unless that content was actually supplied in the request.
- Keep answers compact enough to work inside a phone app unless the user explicitly asks for a deep treatment.

MR DARKNESS CONTEXT
${JSON.stringify(context, null, 2)}`;
}

function buildInput(history: ChatMessage[], message: string) {
  const recent = Array.isArray(history) ? history.slice(-14) : [];
  const items = recent
    .filter(m => m && typeof m.text === "string")
    .map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: clampText(m.text, 10000)
    }));

  // The frontend normally includes the current user message in history already.
  // Avoid duplicating it if it is the last item.
  const last = items[items.length - 1];
  if (!last || last.role !== "user" || last.content !== message) {
    items.push({ role: "user", content: message });
  }
  return items;
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const chunks: string[] = [];
  for (const item of Array.isArray(data?.output) ? data.output : []) {
    for (const part of Array.isArray(item?.content) ? item.content : []) {
      if ((part?.type === "output_text" || part?.type === "text") && typeof part?.text === "string") {
        chunks.push(part.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);

  const requiredToken = Deno.env.get("MD_ACCESS_TOKEN") || "";
  const suppliedToken = req.headers.get("x-md-access") || "";
  if (!requiredToken || suppliedToken !== requiredToken) {
    return json(req, { error: "Unauthorized Mr Darkness client." }, 401);
  }

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return json(req, { error: "Invalid JSON body." }, 400);
  }

  if (payload.action === "ping") {
    return json(req, { ok: true, message: "Mr Darkness brain is online." });
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY") || "";
  if (!apiKey) return json(req, { error: "OPENAI_API_KEY is not configured on the backend." }, 500);

  const mode = clampText(payload.mode || "creative_director", 60);
  const message = clampText(payload.message, 15000).trim();
  if (!message) return json(req, { error: "Message is required." }, 400);

  const context = cleanContext(payload.context);
  const instructions = buildInstructions(mode, context);
  const input = buildInput(payload.history || [], message);
  const model = Deno.env.get("OPENAI_MODEL") || "gpt-6.1-sol";

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions,
      input,
      store: false,
      max_output_tokens: 1800
    })
  });

  const data = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    console.error("OpenAI error", upstream.status, data?.error?.type || "unknown");
    return json(req, { error: data?.error?.message || `AI provider returned ${upstream.status}.` }, 502);
  }

  const answer = extractOutputText(data);
  if (!answer) return json(req, { error: "AI returned no text." }, 502);

  return json(req, {
    answer,
    mode,
    model: data?.model || model,
    usage: data?.usage ? {
      input_tokens: data.usage.input_tokens,
      output_tokens: data.usage.output_tokens,
      total_tokens: data.usage.total_tokens
    } : undefined
  });
});
