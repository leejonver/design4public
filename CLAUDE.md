# CLAUDE.md

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Project Context (design4public unified repo)

**Layout:** public site `app/(site)`, admin UI `app/admin` (client + @vapor-ui),
admin API `app/api/admin` (RLS via user session, not service role). Auth is
client-side in `components/admin/AuthContext.tsx` (`signInWithPassword`/`signOut`);
signup posts to `/api/admin/auth/signup`. Search: `lib/search` (pgvector + trigram
hybrid, OpenAI embeddings + GPT-4o-mini captions).

**Types:** `lib/database.types.ts` is generated + post-processed —
`npm run gen:types` runs `supabase gen types` then `scripts/postprocess-types.mjs`
(narrows `profiles.role/status`, appends the 6 enum aliases). Run it against a
fully-migrated local DB (`supabase db reset` first). `lib/admin-types.ts`
re-exports those enums — do not redefine them.

**Local stack + gate:** E2E runs only against local Supabase (Docker); it never
touches production (`tests/e2e/global.setup.ts` hard-fails on a non-local host).
After **every** `supabase db reset`, run `docker restart supabase_kong_design4public`
before Playwright — reset restarts GoTrue but not Kong (stale upstream → 502).
Run the full gate (tsc + lint + vitest + build + Playwright ×2) as **one agent
stack**; a single green Playwright run is not sufficient evidence.

**DB safety:** production DB is additive-migration-only; the sole destructive
migration is gated separately (M11). See `docs/specs/2026-07-03-unified-repo-design.md`.
