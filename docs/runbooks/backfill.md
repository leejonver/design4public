# Backfill Runbook (search + captions)

Both scripts read `DATABASE_URL` and `OPENAI_API_KEY` from the environment or
`.env.local`. They are resumable and rate-limit-aware (exponential backoff on
429/5xx and on transient network errors). Order matters: **captions first**, so
the re-embed sees caption-enriched `search_source` bodies.

## 1. Captions (photos.ai_caption)
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
OPENAI_API_KEY=sk-... npm run backfill:captions        # only NULL ai_caption
# npm run backfill:captions -- --all                   # re-caption everything
```
GPT-4o-mini vision → `photos.ai_caption`(committed per photo → crash-resumable).
Non-public image URLs (localhost/*.local) are skipped (OpenAI fetches server-side).
Without `OPENAI_API_KEY` it exits 0 (nothing to generate).

## 2. Search index (embeddings + trigram)
```bash
DATABASE_URL=… OPENAI_API_KEY=… npm run backfill:search -- --all
```
Re-embeds `search_index` with `text-embedding-3-small`. Run with `--all` after a
caption backfill so every row is re-embedded from the enriched source.

## Production (M7 cutover)
Same commands with the prod `DATABASE_URL`/keys, run **after** additive migrations
are applied. See `docs/runbooks/cutover.md`.
