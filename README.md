# Mr Darkness HQ

A phone-first creative operating system for the recurring Mr Darkness artist/character.

## Core sections

- Control Room
- Ask Mr Darkness
- Character Bible
- Lyrics Lab
- Suno Studio
- Visual Lab
- Marketing HQ
- Song Vault

## Ask Mr Darkness modes

- Creative Director
- Song Doctor
- Lyric Writer
- Suno Engineer
- Producer
- Visual Director
- Marketing Director

Every AI request receives the same Character Bible, learned LIKE / DON'T memory, and active-song context.

## Local-first behavior

The app remains useful without an AI connection. Character canon, taste memory, songs, lyrics, prompts, visual briefs, campaign briefs, and exports are stored locally in the browser.

## Secure AI architecture

The browser **never receives the OpenAI API key**.

Flow:

`GitHub Pages app -> Supabase Edge Function -> OpenAI Responses API`

The Edge Function requires a private `x-md-access` token and reads the OpenAI key from Supabase Edge Function secrets.

### Browser-safe configuration

`config.js` contains only:

- Supabase project URL
- Supabase publishable key
- Edge Function name

Never place an OpenAI API key or Supabase secret key in `config.js`.

### Required Edge Function secrets

Set these in Supabase **Edge Functions -> Secrets**:

- `OPENAI_API_KEY` — OpenAI API key
- `MD_ACCESS_TOKEN` — a long random private token used only by this personal app
- `ALLOWED_ORIGIN` — normally `https://moldavite333.github.io`
- `OPENAI_MODEL` — optional; defaults to `gpt-6.1-sol`

The function is configured with `verify_jwt = false` because it performs its own private-token authentication using `x-md-access`.

## Deployment

The static frontend can be served directly with GitHub Pages from the `main` branch and repository root.

The backend lives at:

`supabase/functions/ask-mr-darkness/index.ts`

and is configured by:

`supabase/config.toml`

## Privacy

The current Edge Function sends only the context needed for the current AI request. OpenAI Responses requests are sent with `store: false`. Local project memory remains in the browser unless it is included as context for an AI request.
