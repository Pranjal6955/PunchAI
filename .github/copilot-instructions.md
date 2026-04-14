# PunchAI Copilot Instructions

## Architecture
- `backend/` is a FastAPI RAG API; `ui/` is a Next.js 16 dashboard that consumes it.
- The backend flow is: ingest PDF/URL/FAQ data -> clean and chunk in `backend/app/services/processor.py` -> store raw rows in Prisma/Postgres and embeddings in ChromaDB -> retrieve context in chat -> generate with OpenRouter, then Groq fallback.
- Keep bot data isolated by `bot_id`: `backend/app/core/vector_store.py` creates one Chroma collection per bot (`bot_{bot_id}`).
- `backend/prisma/schema.prisma` is the source of truth for relations between `User`, `Bot`, `DataSource`, `DocumentChunk`, `Faq`, `Chat`, and `Message`.

## Backend conventions
- Register API routes in `backend/app/main.py`; the main routers live under `backend/app/api/routes/`.
- Protected endpoints use `get_current_user` from `backend/app/api/deps.py`; most bot, data source, and chat actions enforce ownership checks before writing.
- Use the shared Prisma client `db` from `backend/app/core/database.py`; do not create per-request clients.
- Match existing request/response shapes in `backend/app/schemas/*.py`; schemas use camelCase fields like `botPersona`, `accessToken`, and `tokenType` even though Prisma maps many columns to snake_case.
- When modifying data mutation logic, update the Prisma model, the route, and `backend/app/schemas/` together.
- Runtime data lives in `backend/chroma_db/` and `backend/uploads/`; these are working directories, not source assets.
- Tests in `backend/tests/` use async `pytest`, `httpx.AsyncClient`, and `LifespanManager`; auth fixtures create real users through `/api/auth/signup`.

## UI conventions
- `ui/lib/api-session.ts` is the single API client layer; add or change backend calls there first, then update the pages/components that use it.
- Auth state is stored in `localStorage` under `authToken`; `authorizedFetch()` adds the bearer token and retries once after `/api/auth/refresh`.
- Dashboard pages under `ui/app/dashboard/**` are client components and use shadcn/ui-style primitives from `ui/components/ui/` plus Tailwind classes.
- The dashboard mirrors backend entities: agents in `ui/app/dashboard/chatbot/`, sources in `ui/app/dashboard/dataSource/`, and chat sessions in `ui/components/dashboard/chat-interface.tsx`.
- Keep Next.js assumptions current: this repo uses Next 16.2 and includes a local `ui/CLAUDE.md` warning that older App Router patterns may be outdated.

## Workflow
- Backend setup: `cd backend && source .venv/bin/activate && pip install -r requirements.txt && prisma db push && prisma generate && uvicorn app.main:app --reload --port 8000`.
- Backend tests: `cd backend && pytest tests/`.
- UI setup and checks: `cd ui && npm run dev`, `npm run build`, and `npm run lint`.
- When changing an API contract, update the backend schema/route, the UI helper in `ui/lib/api-session.ts`, and the affected page/component in the same change.