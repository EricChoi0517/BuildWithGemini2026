# Echo Journal

Echo Journal is a 30-second voice journal that transcribes with Gemini Live, analyzes mood and themes, and stores everything in Supabase so you can see patterns over time.

Built with **React**, **Vite**, **Tailwind CSS**, **Supabase**, **Gemini** (Live API + Flash), **Framer Motion**, **date-fns**, and **Capacitor** for the **Build with Gemini 2026** Hackathon — **Live API** track · [GitHub](https://github.com/EricChoi0517/BuildWithGemini2026)

## Quick start

```bash
git clone https://github.com/EricChoi0517/BuildWithGemini2026.git
cd BuildWithGemini2026
npm install
cp .env.example .env
# Add VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEMINI_API_KEY
```

In Supabase → SQL Editor, run `supabase/schema.sql`. Optional demo data: configure `supabase/seed.js` with your service role key, then `node supabase/seed.js`.

```bash
npm run dev
# http://localhost:3000
```

Deploy on [Vercel](https://vercel.com) with the same `VITE_*` env vars; `vercel.json` handles SPA routing.

## License

MIT
