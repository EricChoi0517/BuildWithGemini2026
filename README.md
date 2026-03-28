# Echo Journal

30-second voice journal with AI-powered insights. Built for the Build with Gemini 2026 Hackathon — **Live API Track**.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend/DB**: Supabase (Auth, PostgreSQL, RLS)
- **AI**: Gemini Live API (real-time transcription) + Gemini 2.0 Flash (extraction)
- **Audio**: Web Audio API (waveform viz + acoustic feature extraction)
- **iOS Wrap**: Capacitor (post-hackathon)

## Quick Start

```bash
# 1. Clone
git clone https://github.com/EricChoi0517/BuildWithGemini2026.git
cd BuildWithGemini2026

# 2. Install
npm install

# 3. Configure env
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY

# 4. Set up Supabase
# Go to your Supabase project → SQL Editor → paste contents of supabase/schema.sql → Run

# 5. Dev server
npm run dev
# Opens at http://localhost:3000
```

## Project Structure

```
src/
├── main.jsx                 # Entry point
├── App.jsx                  # Router + auth wrapper
├── index.css                # Global styles + Tailwind
├── context/
│   └── AuthContext.jsx      # Supabase auth state
├── lib/
│   ├── supabase.js          # DB client + CRUD operations
│   ├── gemini.js            # Live API + extraction + weekly summary
│   └── audio.js             # Recorder, waveform, acoustic features
├── hooks/
│   └── useRecorder.js       # Recording lifecycle hook
├── components/
│   ├── Layout.jsx           # App shell with bottom nav
│   ├── BottomNav.jsx        # Tab bar (Home/Calendar/Record/Analytics/Settings)
│   ├── ProtectedRoute.jsx   # Auth guard
│   ├── Waveform.jsx         # Canvas waveform visualization
│   └── MoodDot.jsx          # Sentiment color dot
├── pages/
│   ├── LoginPage.jsx        # Login/Signup
│   ├── HomePage.jsx         # Dashboard: mood timeline, insights, recent entries
│   ├── RecordPage.jsx       # Recording flow: mic → waveform → transcript → save
│   ├── CalendarPage.jsx     # Month view with entry details
│   ├── AnalyticsPage.jsx    # Insights, weekly summaries, topic/entity maps
│   └── SettingsPage.jsx     # Profile, privacy, preferences
└── assets/
supabase/
└── schema.sql               # Full database schema with RLS policies
```

## Database (Supabase)

Four tables with Row-Level Security:

| Table | Purpose |
|-------|---------|
| `profiles` | User settings, display name |
| `entries` | Transcript + acoustic features + Gemini extraction per recording |
| `insights` | Cross-entry patterns (emotional, relational, vocabulary drift) |
| `weekly_summaries` | Generated weekly narrative + stats |

Run `supabase/schema.sql` in your Supabase SQL Editor to set up everything including auto-profile creation on signup.

---

## Work Split (3 Team Members)

### Person 1: Recording + Audio + Live API
**Owner of**: `src/lib/audio.js`, `src/lib/gemini.js`, `src/hooks/useRecorder.js`, `src/components/Waveform.jsx`, `src/pages/RecordPage.jsx`

**Tasks**:
- [ ] Wire up Gemini Live API WebSocket connection (currently scaffolded, needs testing with real API key)
- [ ] Test audio recording flow end-to-end (mic permission → PCM capture → base64 → Live API → transcript)
- [ ] Tune acoustic feature extraction thresholds (energy normalization, pause detection sensitivity, speaking rate estimation)
- [ ] Implement auto-stop at 30 seconds with smooth waveform fadeout
- [ ] Handle edge cases: mic denied, no speech detected, WebSocket disconnect, slow connection
- [ ] Build the post-recording Gemini extraction pass (sentiment, entities, topics, unresolved threads)
- [ ] Optional: add pitch detection via `pitchy` or `ml5.js` library for better pitch variance

### Person 2: Backend + Data + Insight Engine
**Owner of**: `supabase/schema.sql`, `src/lib/supabase.js`, insight generation logic

**Tasks**:
- [ ] Set up Supabase project (create project, run schema, configure auth providers)
- [ ] Test all CRUD operations (save entry, get entries, date range queries)
- [ ] Build insight generation engine — runs after each new entry:
  - Emotional pattern detection (3+ entries with declining sentiment)
  - Unresolved thread detection (entity mentioned once with negative sentiment, never revisited)
  - "This time last month" card (find entry from ~30 days ago, surface exact transcript)
  - Vocabulary drift (track hedging words: "maybe", "I guess", "kind of" — flag increases)
  - Relationship mapping (entities in positive vs negative sentiment contexts)
- [ ] Build weekly summary cron/trigger (could be Supabase Edge Function or client-side on app open)
- [ ] Create 3 demo personas with 21 days of seeded entries each (founder, student, parent)
- [ ] Write seed script to populate demo data with realistic sentiment arcs and planted threads
- [ ] Set up Supabase auth (email/password, possibly Google OAuth)

### Person 3: UI + Pages + Polish
**Owner of**: All files in `src/pages/`, `src/components/Layout.jsx`, `src/components/BottomNav.jsx`, `src/components/MoodDot.jsx`, `src/index.css`

**Tasks**:
- [ ] Polish all 5 pages: Home, Record, Calendar, Analytics, Settings
- [ ] Build persona switcher for demo mode (dropdown in Settings or separate demo route)
- [ ] Implement entry detail modal on Calendar page
- [ ] Build sentiment bar chart on Analytics page
- [ ] Add staggered entrance animations (framer-motion) on page loads
- [ ] Ensure mobile-first responsive design (test on phone browsers)
- [ ] Handle loading states, empty states, and error states across all pages
- [ ] Add the "Welcome back" message logic (shown if last entry > 24h ago)
- [ ] Optional follow-up question UI after recording (rotating question, dismissible)
- [ ] iOS safe area testing (if Mac teammate can test in simulator via Capacitor)
- [ ] Dark theme polish — ensure all text passes WCAG contrast on dark backgrounds

---

## Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# VITE_SUPABASE_URL
# VITE_SUPABASE_ANON_KEY
# VITE_GEMINI_API_KEY
```

Vite builds to `dist/` which Vercel auto-detects. Add a `vercel.json` for SPA routing:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

## iOS Wrap (Post-Hackathon)

```bash
npm run build
npm run cap:init
npm run cap:add:ios
npm run cap:sync
npm run cap:open:ios   # Opens Xcode — Mac only
```

## Demo Strategy

1. Open app → show persona switcher → pick "Stressed Founder" (21 days of data)
2. Walk through mood timeline, insights, weekly summary — this shows the full feature set
3. Switch to real team member's entries (recorded during hackathon)
4. Do a live recording on stage — 30 seconds, show waveform, show transcript appearing
5. Show the entry save + extraction results

## License

MIT
