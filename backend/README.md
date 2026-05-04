# PunchAI Backend (RAG Engine)

A high-performance **Hybrid Retrieval-Augmented Generation (RAG)** backend built with **FastAPI**, **Prisma**, **ChromaDB**, and **PostgreSQL FTS**.

---

## 📁 Project Structure

```
backend/
├── chroma_db/             # Persistent Vector Database (Semantic Search)
├── uploads/               # Local PDF storage (for indexing)
├── tests/                 # Automated Test Cases (Pytest)
├── prisma/
│   └── schema.prisma      # DB Schema (Shared with Neon PostgreSQL)
├── app/
│   ├── main.py            # FastAPI Entry Point (Lifespan, Middleware)
│   ├── core/
│   │   ├── config.py      # App Settings / Env
│   │   ├── database.py    # Prisma SQL Client (Postgres)
│   │   ├── security.py    # JWT Auth & Bcrypt Hashing
│   │   ├── vector_store.py# ChromaDB Client & Collection Management
│   │   ├── limiter.py     # Slowapi Rate Limiting
│   │   ├── logging.py     # Loguru Structured Logging
│   │   └── deps.py        # Shared Dependencies (Auth, API Keys)
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py    # Signup / Login
│   │       ├── bots.py    # Managed AI Bots (Internal)
│   │       ├── external.py# External Widget API (API Key Auth)
│   │       ├── datasources# PDF / URL / FAQ Ingestion
│   │       ├── chats.py   # Dashboard Chat Interface
│   │       └── ai.py      # Core AI Utilities (Embeddings, LLM Ops)
│   ├── services/
│   │   ├── processor.py   # Hybrid Search (Vector + Keyword) Logic
│   │   └── llm.py         # Async LLM orchestration (OpenRouter/Groq)
│   ├── schemas/           # Pydantic Data Models (Request/Response)
├── requirements.txt
├── .env                   # Configuration
└── .gitignore
```

---

## 🚀 The Hybrid RAG Pipeline

PunchAI uses a **Hybrid Search** strategy to ensure high precision and relevance:

1.  **Ingest**: PDFs, URLs, or manual FAQs are extracted and sanitized.
2.  **Sync**: Data is stored simultaneously in **PostgreSQL** (for Keyword Search) and **ChromaDB** (for Semantic Search).
3.  **Retrieve**: When a user queries:
    - **Vector Search**: Finds conceptually similar content.
    - **Keyword Search (FTS)**: Finds exact matches/lexical matches using Postgres Full-Text Search.
4.  **Rank**: Results are merged and deduplicated.
5.  **Stream**: The LLM (via OpenRouter or Groq fallback) generates a response that is streamed via **SSE (Server-Sent Events)** for a premium user experience.

---

## 🛠️ Setup & Running

### 1. Prerequisites
- **Python 3.10+** (Recommend 3.11)
- **Neon PostgreSQL** (Serverless Postgres)
- **OpenRouter API Key** (Primary LLM)
- **Groq API Key** (Fallback LLM)

### 2. Install & Initialize
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
playwright install chromium

# Push schema to Neon & Generate Client
npx prisma db push
```

### 3. Run Server
```bash
uvicorn app.main:app --reload
```

---

## 🌐 Production Readiness

### 1. Environment Configuration
Ensure `.env` has:
- `APP_ENV="production"`
- `CORS_ORIGINS="https://your-frontend.com"` (Include your live frontend URL)
- `DATABASE_URL` (Neon PostgreSQL)

### 2. Deployment (Docker)
Build and run the production container:
```bash
docker build -t punchai-backend .
docker run -p 8000:8000 --env-file .env punchai-backend
```

### 3. Live Links
The integration tab in the UI will automatically generate script tags using the `NEXT_PUBLIC_API_URL` configured in the frontend. Ensure the backend is reachable at that address.

---

## 📌 Core API Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/signup` | Register new user + JWT |
| **Bots** | `POST` | `/api/bots/` | Create minimalist RAG Bot |
| **Data** | `POST` | `/api/datasources/upload` | Upload PDF (Hybrid-Index) |
| **External** | `POST` | `/api/external/chat/init` | Start Widget Session (API Key) |
| **Chat** | `POST` | `/api/external/chat/{id}/message/stream` | Streamed RAG Response |

---

## 🔒 Performance & Security
- **Asynchronous**: All I/O and CPU-bound AI operations are handled asynchronously.
- **Rate Limited**: All public-facing chat endpoints are protected by `slowapi`.
- **Hybrid Search**: Leverages both the power of embeddings and the surgical precision of PostgreSQL FTS.
- **Structured Logs**: Integrated `loguru` for enterprise-grade observability.
