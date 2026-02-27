English Speaking Practice Tool
Status: Production-ready spec for Claude Code. Personal English learner app: Sentence/phrasal practice → OpenAI GPT-4o-mini generates IPA phonetic/stress/tips. Supabase DB/auth. Static GitHub Pages deploy. TDD tests.
Copy-paste to Claude Code: “Build FULL SvelteKit app from this complete spec. Generate ALL files, tests, GitHub Actions. Use TypeScript, shadcn-svelte, your best practices.”
Current Date: Feb 25, 2026 | Dev: tway dev (HCMC, TDD/SOLID expert)
🎯 Project Goals
- Speak English via topic sentences (career moves → 10+ seeded).
- Input any sentence/phrasal → Instant phonetic/stress/tips via OpenAI.
- Track progress/favorites w/ simple email auth.
- Mobile-first, offline-capable, GitHub hosted.
🛠️ Tech Stack
- Framework: SvelteKit 2.x + adapter-static (GitHub Pages)
- UI: shadcn-svelte + svelte-sonner (toasts)
- DB/Auth: Supabase (Postgres + Auth)
- LLM: OpenAI GPT-4o-mini (JSON structured output)
- Audio: Web SpeechSynthesis API
- Testing: Vitest + @playwright/test
- Icons: @iconify/svelte
