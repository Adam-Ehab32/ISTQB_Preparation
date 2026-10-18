# ISTQB v4.0 Prep Master
Next.js 14 (App Router) + Tailwind + Framer Motion + React Flow + Supabase.

## Run
    npm i && npm run dev            # no env vars = local demo mode (data in this browser only)

## Real accounts (Supabase)
1. Create a Supabase project. Apply `supabase/migrations/0001_init.sql`, `0002_gamification.sql`, `0003_learning_features.sql`, `0004_study_and_quiz_engine.sql`, then `supabase/seed.sql` (SQL editor or `supabase db push`).
2. Auth > Providers: enable Email and Google. Auth > URL config: add `<site>/auth/callback` and `<site>/reset-password` as redirect URLs.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`).

## Tests
    # E2E (Playwright, demo mode): start the app on :3100, then
    python3 e2e/smoke2.py http://localhost:3100   # auth, theme, quiz, XP, leaderboard, uploader, mock, mind-map (40 checks)
    python3 e2e/smoke3.py http://localhost:3100   # Smart Coffee, Mistake Vault, analogies, Spot the Bug, chapter readiness (25 checks)
    python3 e2e/smoke4.py http://localhost:3100   # Study & Memorize, quiz config (count/K-level/difficulty/set), non-repeating quizzes, generated K3 variants (25 checks)
    # SQL (scratch Postgres with stubbed auth schema), from repo root:
    psql -d <scratch_db> -f supabase/tests/sqltest.sql
    psql -d <scratch_db2> -f supabase/tests/sqltest3.sql
    psql -d <scratch_db3> -f supabase/tests/sqltest4.sql

## Content
Questions (39 original questions, Practice Sets A-D, difficulty 1-3), analogies and Spot-the-Bug cards live in `src/lib/data.ts`; study notes in `src/lib/summaries.ts`; parameterised K3 generators in `src/lib/gen.ts`; `npm run gen-seed` regenerates `supabase/seed.sql` from it.
