# Unscripted — AI Mock Interview Platform

> Practice the interview. Not the script.

**Live → [unscripted-interview.vercel.app](https://unscripted-interview.vercel.app)**

Unscripted is a voice-first AI mock interview platform that reads your resume and actually grills you on it. Upload your CV, pick your company and round type, and have a real two-way voice conversation with an AI interviewer who pushes back on weak answers, asks follow-up questions, and throws in off-script moments — just like a real interview.

---

## What makes it different

Most interview prep tools give you a question. You type an answer. Repeat.

Unscripted works differently:

- **Voice both ways** — The AI interviewer speaks. You answer out loud. This trains the actual skill, not the typing skill.
- **Resume-aware questions** — Upload your CV. The AI reads it before asking a single question. Expect "I see you interned at Gammon India — walk me through a specific problem you solved, not what the project was."
- **Real pushback** — Weak answers get challenged. "I'm not convinced — can you give me a concrete example?" is a feature, not a bug.
- **Off-script moments** — Every 3-4 questions, something unexpected drops. A scenario, a personal question, a curveball. You can't rehearse your way through this.
- **Persona system** — Each category has named interviewers with distinct styles (friendly, balanced, aggressive). Not the same robotic AI voice every time.
- **Post-session scorecard** — Scored on Technical Depth, Communication, Confidence, Role Relevance, and Preparation. Strong and weak moments identified. Specific improvements listed.

---

## Interview categories

| Category | Focus |
|---|---|
| 🎓 Campus Placement | Core engineering, IT, consulting, FMCG campus drives |
| 💼 Job Switch | Resume-deep technical + motivation probing for working professionals |
| 🏛 MBA GD-PI | IIM and top B-school personal interviews, case discussion |
| 🔬 Foreign MS / PhD | SOP probing, research depth, program fit for US/UK/EU |
| ⚖️ UPSC / Govt | DAF-based personality test, current affairs, ethical dilemmas |
| 🏅 Scholarship | Fulbright, Rhodes, PM Research Fellowship interviews |

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS SPA — no framework, no bundler |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) — browser-native, zero cost |
| AI | Gemini 2.0 Flash (primary) → Groq LLaMA 3.3 70B (fallback) |
| PDF parsing | PDF.js — client-side, resume never leaves the browser as a file |
| Auth | Supabase (email + Google OAuth) |
| Database | Supabase (sessions, feedback, events tables) |
| Hosting | Vercel (serverless API + static frontend) |
| Cost to run | $0 — all free tiers |

---

## How it works

```
Setup (60s)
  ↓
Upload CV → pick category → company → round type → personality
  ↓
Interview Room
  AI speaks question (SpeechSynthesis)
  → User answers out loud (SpeechRecognition)
  → Full transcript sent to Gemini with system prompt
  → Gemini responds with next question or pushback
  → Loop until 12 questions
  ↓
Session saved (anonymous or linked to account)
  ↓
Results Page (requires signup — post-session gate)
  Transcript → Gemini scoring prompt → JSON scores
  → Animated scorecard + strong/weak moments + improvements
  ↓
Feedback form → stored in Supabase for prompt improvement
```

---

## File structure

```
/
├── index.html          — Landing page + setup wizard + auth modal
├── interview.html      — Interview room (voice UI)
├── results.html        — Post-session scorecard
├── dashboard.html      — User session history
├── css/
│   └── style.css       — All styles (dark hero, light body, interview room)
├── js/
│   ├── config.js       — Supabase credentials, feature flags, APP_URL
│   ├── db.js           — All Supabase operations (sessions, feedback, events)
│   ├── auth.js         — Email + Google OAuth auth module
│   ├── prompts.js      — System prompts, personas, scoring prompt (the product core)
│   ├── voice.js        — SpeechRecognition + SpeechSynthesis wrapper
│   ├── interview.js    — Interview state machine
│   ├── results.js      — Scoring, scorecard animation, feedback form
│   ├── resume.js       — Client-side PDF parsing via PDF.js
│   ├── dashboard.js    — Session history + stats
│   └── main.js         — Setup wizard, nav, animations, cursor
├── api/
│   └── interview.js    — Vercel serverless function (Gemini → Groq fallback)
├── vercel.json         — Rewrites for SPA routing
└── supabase-setup.sql  — Run once to create tables + RLS policies
```

---

## Running locally

No build step. No npm install. Open `index.html` directly or:

```bash
npx serve .
# → http://localhost:3000
```

Voice recognition requires Chrome or Edge (Safari has limited support).

---

## Environment variables

Required on Vercel (Settings → Environment Variables):

```
GEMINI_API_KEY     — Google AI Studio (aistudio.google.com)
GROQ_API_KEY       — Groq Console (console.groq.com)
```

---

## Supabase setup

Run `supabase-setup.sql` once in Supabase SQL Editor. Creates:

- `sessions` — interview sessions (supports anonymous + linked-to-user)
- `feedback` — post-session user feedback (for prompt engineering)
- `events` — analytics (interview_started, interview_completed, etc.)

RLS policies allow anonymous inserts (temp sessions before signup) and user-scoped reads after authentication.

---

## Auth flow

Anonymous → Authenticated session transfer:

1. User starts interview without signing up
2. Session saved with `temp_session_id` in sessionStorage
3. After interview, results page shows a signup gate
4. On signup, `DB.linkSession(tempId, userId)` links the session to the new account
5. User sees their results immediately

---

## Prompt engineering

`js/prompts.js` is the heart of the product. Key decisions:

- **Temperature 0.85** — high enough for natural variation, low enough for coherent questions
- **Full conversation history** sent each turn — AI remembers what you already said
- **8 named personas** across 10 category/round combinations — Vikram Nair (L&T), Priya Menon (IIM panel), Dr. Arjun Mehta (US admissions), etc.
- **OFF_SCRIPT pool** — 9 unexpected questions injected every 3-4 turns
- **PUSHBACKS array** — challenge phrases triggered when answers are short or generic
- **Category guidance** — each of 6 categories has a detailed focus object: what to probe, what context matters, what makes a strong vs weak answer
- **Scoring prompt** — separate Gemini call after session ends, returns structured JSON with 5 dimension scores + 2 strong moments + 2 weak moments + 3 improvements

---

## Deploy

```bash
# First time
vercel

# Production
vercel --prod
```

Vercel auto-deploys on every push to `main` via GitHub integration.

---

## Built by

**Sahil Solankey** — Full-Stack Developer & AI Engineer

- Portfolio: [sahilsolankey.vercel.app](https://sahilsolankey.vercel.app)
- GitHub: [@PoisonOps](https://github.com/PoisonOps)
- WhatsApp: [+91 70804 42040](https://wa.me/917080442040)
