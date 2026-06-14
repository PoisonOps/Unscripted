# CLAUDE.md — Unscripted (AI Mock Interview Platform)

Read this file completely before touching any code.

---

## What This Product Is

**Unscripted** is a voice-based AI mock interview platform. The core experience:
1. User sets up an interview (category, context, resume upload)
2. An AI persona (named, with a specific company and style) conducts a live voice interview
3. User speaks out loud — speech recognition captures their answer
4. AI responds with the next question (spoken via TTS)
5. After 10-12 exchanges, a scorecard is generated

The product quality lives in `js/prompts.js` — the system prompts, personas, and guidance. Every improvement to interview quality starts there.

---

## Running the App

No build tools. No npm. No bundler. Open `index.html` directly or:

```bash
npx serve .          # serves on localhost:3000
python3 -m http.server 8080
```

For the serverless API (`api/interview.js`) to work, you need:

```bash
npm i -g vercel
vercel dev           # runs local dev server with API routes on localhost:3000
```

---

## Architecture

### Pages (not a SPA — each page is self-contained)

| Page | File | Purpose |
|------|------|---------|
| Landing | `index.html` | Marketing + setup wizard modal |
| Interview | `interview.html` | Live interview room |
| Results | `results.html` | Scorecard + feedback (auth-gated) |
| Dashboard | `dashboard.html` | Session history (requires login) |

Navigation between pages is via `window.location.href` — no router.

### Script load order (critical)

**index.html:** `config.js → db.js → auth.js → scene.js → prompts.js → resume.js → main.js`

**interview.html:** `config.js → db.js → auth.js → prompts.js → voice.js → interview.js`

**results.html:** `config.js → db.js → auth.js → prompts.js → results.js`

**dashboard.html:** `config.js → db.js → auth.js → dashboard.js`

`config.js` must always be first — it defines `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IS_DEV`, `FLAGS`, `log()`.

### Data layer (`js/db.js`)

All Supabase operations go through `DB.*`. Key methods:
- `DB.saveSession(data)` — saves interview + transcript, returns session row
- `DB.getSession(id)` — fetch session by UUID
- `DB.getUserSessions()` — all sessions for current user
- `DB.saveScores(sessionId, scores)` — attach AI-generated scores to session
- `DB.saveFeedback(sessionId, feedback)` — save user feedback
- `DB.logEvent(event, metadata)` — fire-and-forget analytics

### Auth (`js/auth.js`)

- `Auth.getUser()` — returns current user or null
- `Auth.signupWithEmail(email, password, name)`
- `Auth.loginWithEmail(email, password)`
- `Auth.loginWithGoogle()` — OAuth redirect
- `Auth.logout()` — signs out, redirects to `/`
- `Auth.onAuthChange(callback)` — listen for auth state changes
- `Auth.handlePostSignup(user)` — links anonymous session to new user

### Interview flow (`js/interview.js`)

State machine: `idle → thinking → speaking → listening → thinking → ...`

The `Interview` object:
1. Reads `us_setup` from `sessionStorage`
2. Picks a persona via `pickPersona(category, roundType)` from `prompts.js`
3. Builds system prompt via `buildSystemPrompt(setup)` from `prompts.js`
4. Calls `/api/interview` (POST) to get AI response
5. Speaks response via `Voice.speak()`
6. Listens for user answer via `Voice.startListening()`
7. On final transcript, sends to AI for next question
8. After 12 exchanges (or AI says it's done), calls `DB.saveSession()` and redirects to `/results`

### Results flow (`js/results.js`)

1. On page load, check if user is logged in
2. If not: show auth gate (signup/login modal)
3. If yes: fetch session from Supabase
4. If session has `scores`: render directly
5. If no scores: call `/api/interview` with scoring prompt, parse JSON response, save scores, render

### Prompt system (`js/prompts.js`)

The most important file. Contains:
- `PERSONAS` — named interviewers with titles, companies, and style descriptions
- `CATEGORY_GUIDANCE` — specific question focus areas per category + round type
- `OFF_SCRIPT` — surprise questions pool
- `PUSHBACKS` — pushback phrases for weak answers
- `PERSONALITY_MODIFIERS` — friendly / balanced / aggressive modifiers
- `buildSystemPrompt(setup)` — assembles the full system prompt
- `buildScoringPrompt(transcript, setup)` — assembles the scoring prompt
- `pickPersona(category, roundType)` — random persona selection

To improve interview quality: edit `CATEGORY_GUIDANCE` and `PERSONAS`.

### Voice (`js/voice.js`)

- `Voice.init()` — sets up `SpeechRecognition` + pre-loads TTS voices
- `Voice.speak(text, onEnd)` — speaks text, calls `onEnd` when done
- `Voice.startListening()` — starts speech recognition
- `Voice.stopListening()` — stops recognition
- `Voice.stop()` — stops everything

Chrome TTS bug: long utterances get cut off. `_speakChunked()` splits text into sentences.

### Three.js (`js/scene.js`)

**ONE renderer. ONE scene. Always. Forever.**

Particle wave on the landing page hero:
- 150 particles in a sinusoidal wave shape
- Particles breathe (y oscillation over time)
- Mouse repulsion effect
- LineSegments connecting nearby particles
- Never initializes on mobile (`isMobile` check)
- Pauses on `visibilitychange` hidden
- Single frame only if `prefers-reduced-motion`

### API (`api/interview.js`)

Vercel serverless function. POST only.

Request body: `{ messages: [{role, content}], systemPrompt: string }`

Response: `{ response: string, provider: 'gemini'|'groq' }`

Provider priority:
1. Gemini 2.0 Flash (`GEMINI_API_KEY`)
2. Groq llama-3.3-70b (`GROQ_API_KEY`)

---

## Key Files

| File | Purpose |
|------|---------|
| `js/config.js` | Environment detection, Supabase credentials, feature flags |
| `js/db.js` | All Supabase operations |
| `js/auth.js` | Supabase auth wrapper |
| `js/prompts.js` | AI system prompts, personas, scoring — **start here to improve quality** |
| `js/voice.js` | SpeechRecognition + SpeechSynthesis wrapper |
| `js/interview.js` | Interview state machine |
| `js/results.js` | Scorecard rendering + feedback |
| `js/dashboard.js` | Session history |
| `js/main.js` | Boot, nav, setup wizard, cursor, scroll reveals |
| `js/scene.js` | Three.js particle wave |
| `js/resume.js` | PDF.js resume parser |
| `api/interview.js` | Serverless AI endpoint (Gemini + Groq) |
| `supabase-setup.sql` | Run once in Supabase SQL Editor |
| `css/style.css` | Complete design system |
| `vercel.json` | URL rewrites for clean routes |

---

## Environment Variables (Vercel)

Required for the API to work:

```
GEMINI_API_KEY      — Google AI Studio key (preferred provider)
GROQ_API_KEY        — Groq API key (fallback provider)
```

Supabase credentials are currently hardcoded in `config.js` (dev + prod split). For production, consider moving them to environment variables.

---

## Supabase Setup

Run `supabase-setup.sql` once in the Supabase SQL Editor.

Tables created:
- `sessions` — interview sessions (transcript, scores, metadata)
- `feedback` — user feedback on sessions
- `events` — analytics events

RLS: users can only read their own sessions. Anyone can insert (for anonymous sessions before signup).

Anonymous session linking: when a user completes an interview without being logged in, the session is saved with a `temp_session_id`. When they sign up/log in after seeing their results, `Auth.handlePostSignup()` links the session to their account.

---

## Deploy

```bash
vercel          # preview deploy
vercel --prod   # production deploy
```

Set these env vars in Vercel dashboard:
- `GEMINI_API_KEY`
- `GROQ_API_KEY`

---

## Design System

Design identity: "The Spotlight" — warm black background, amber accent.

Key tokens in `css/style.css`:
- `--bg: #0D0A09` — warm black (not cold navy)
- `--accent: #F5A623` — amber spotlight
- `--text: #F2EDE4` — warm cream
- `--success: #4ADE80` — active mic indicator
- `--font-display: 'Playfair Display'` — headlines, italic
- `--font-body: 'Inter'` — body text
- `--font-mono: 'JetBrains Mono'` — labels, metrics, code

Mobile breakpoint: `1023px`. Three.js never runs on mobile.

---

## Current Priorities

1. Wire up actual Supabase credentials in `config.js`
2. Add `GEMINI_API_KEY` and `GROQ_API_KEY` to Vercel env vars
3. Run `supabase-setup.sql` in Supabase
4. Test full interview flow locally with `vercel dev`
5. Deploy to production with `vercel --prod`
