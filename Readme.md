# 🥊 PunchAI — Hybrid RAG Chatbot Platform

> **Build, deploy, and embed intelligent AI chatbots powered by your own data.**
> PunchAI is a full-stack platform combining a high-performance **Hybrid RAG** (Retrieval-Augmented Generation) backend with a premium, industrial-grade Next.js dashboard.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Docker (Full Stack)](#docker-full-stack)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [The RAG Pipeline](#-the-hybrid-rag-pipeline)
- [Dashboard Pages](#-dashboard-pages)
- [Design System](#-design-system)
- [Development Roadmap](#-development-roadmap)

---

## 🌟 Overview

PunchAI lets you create custom AI chatbot agents, train them on your documents (PDFs, URLs, FAQs), and embed them anywhere via an API-key-authenticated widget. The platform handles the entire lifecycle: data ingestion, hybrid vector + keyword search, LLM orchestration with streaming responses, and a rich management dashboard.

---

## ✨ Key Features

### Backend
- 🔍 **Hybrid RAG Engine** — Combines ChromaDB semantic (vector) search with PostgreSQL Full-Text Search for maximum retrieval accuracy
- ⚡ **Streaming Responses** — LLM output streamed to the client via Server-Sent Events (SSE)
- 📄 **Multi-Format Ingestion** — Upload **PDF**, **Word (.docx)**, **Excel (.xlsx)**, **PowerPoint (.pptx)**, and **URLs**
- 🔑 **Dual Auth Model** — JWT-based session auth for the dashboard; API Key auth for external widget consumers
- 🛡️ **Rate Limiting** — `slowapi` guards all public-facing chat endpoints
- 📊 **RAGAS Evaluation** — Automated RAG quality assessment (Faithfulness, Relevancy, Accuracy)
- 🤖 **Multi-LLM Support** — OpenRouter as primary LLM with Groq as automatic fallback
- 📝 **Structured Logging** — Loguru for enterprise-grade, structured observability

### Frontend
- 🎨 **Premium Dark UI** — Industrial-grade dashboard built with Next.js 16 + Tailwind V4
- 📱 **Responsive & Collapsible Sidebar** — Optimized for all screen sizes
- 🔄 **SWR Data Caching** — Near-instant page transitions with zero redundant network waterfalls
- 💬 **Interactive Playground** — Real-time chat interface with streamed AI responses
- 📊 **Analytics Dashboard** — Bot usage stats, data source counts, activity tracking
- 🧩 **Embeddable Widget** — Drop a chatbot into any third-party site with a single API key
- 🏷️ **Framer Motion Animations** — Smooth, premium micro-animations throughout

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER / CLIENT                            │
│          Browser Dashboard          Embedded Widget             │
└──────────────┬──────────────────────────────┬───────────────────┘
               │  JWT Auth                    │  API Key Auth
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend (Port 3000)                 │
│  Dashboard · Playground · Data Sources · Chat Logs · Account   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST / SSE
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   FastAPI Backend (Port 8000)                   │
│                                                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  Auth Router │  │  Bots Router │  │  Datasources Router  │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │ Chats Router │  │  AI Router   │  │   External Router    │ │
│   └──────────────┘  └──────────────┘  └──────────────────────┘ │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │              Hybrid RAG Processor                       │  │
│   │  Vector Search (ChromaDB) + Keyword Search (PG FTS)     │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │           LLM Orchestration Layer                        │  │
│   │     OpenRouter (Primary) → Groq (Automatic Fallback)    │  │
│   └─────────────────────────────────────────────────────────┘  │
└──────────┬───────────────────────────┬──────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐    ┌───────────────────────┐
│  Neon PostgreSQL    │    │  ChromaDB (local vol)  │
│  (Serverless)       │    │  (Vector Embeddings)   │
│  Users, Bots,       │    │  sentence-transformers │
│  Chats, FTS Index   │    │  all-MiniLM-L6-v2      │
└─────────────────────┘    └───────────────────────┘
```

---

## 📁 Project Structure

```
PunchAI/
├── backend/                        # FastAPI RAG Engine
│   ├── app/
│   │   ├── main.py                 # App entry point (lifespan, CORS, routers)
│   │   ├── core/
│   │   │   ├── config.py           # Settings (pydantic-settings)
│   │   │   ├── database.py         # Prisma client (PostgreSQL)
│   │   │   ├── security.py         # JWT & bcrypt hashing
│   │   │   ├── vector_store.py     # ChromaDB client & collection management
│   │   │   ├── limiter.py          # Slowapi rate limiting
│   │   │   ├── logging.py          # Loguru structured logging
│   │   │   └── deps.py             # Shared dependencies (auth, API keys)
│   │   ├── api/routes/
│   │   │   ├── auth.py             # Signup / Login (JWT)
│   │   │   ├── users.py            # Profile management, avatar upload
│   │   │   ├── bots.py             # Bot CRUD (create, configure, delete)
│   │   │   ├── datasources.py      # PDF / URL / FAQ / Office file ingestion
│   │   │   ├── chats.py            # Dashboard playground chat
│   │   │   ├── ai.py               # Embedding & LLM utilities
│   │   │   ├── external.py         # Embeddable widget API (API Key auth)
│   │   │   └── health.py           # Health check endpoint
│   │   ├── services/
│   │   │   ├── processor.py        # Hybrid search (Vector + FTS) logic
│   │   │   └── llm.py              # Async LLM orchestration / SSE streaming
│   │   └── schemas/                # Pydantic request/response models
│   ├── prisma/
│   │   └── schema.prisma           # Database schema
│   ├── tests/                      # Pytest test suite + RAGAS evaluations
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── ui/                             # Next.js 16 Frontend
│   ├── app/
│   │   ├── (auth)/                 # Login / Signup pages
│   │   ├── dashboard/
│   │   │   ├── page.tsx            # Overview dashboard (stats, quick actions)
│   │   │   ├── chatbot/            # Bot management (list + per-bot playground)
│   │   │   ├── dataSource/         # Data source upload & management
│   │   │   ├── chatlogs/           # Historical conversation logs
│   │   │   └── account/            # User profile & settings
│   │   ├── layout.tsx              # Root layout (fonts, theme provider)
│   │   └── globals.css             # Design system CSS tokens
│   ├── components/
│   │   ├── dashboard/              # Dashboard-specific components
│   │   ├── chatbot/                # Chatbot & playground components
│   │   ├── dashboard-sidebar.tsx   # Collapsible glass sidebar
│   │   ├── dashboard-header.tsx    # Top navigation header
│   │   └── ui/                     # Shadcn/Radix base components (46 files)
│   ├── hooks/
│   │   ├── use-bots.ts             # SWR hook for bot list
│   │   └── use-user.ts             # SWR hook for user profile
│   ├── lib/
│   │   └── utils.ts                # Shared utilities (cn, etc.)
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml              # Full-stack Docker orchestration
├── docker-compose.oracle.yml       # Oracle DB variant
├── design.md                       # UI design system specification
└── plan.md                         # Development roadmap
```

---

## 🛠️ Tech Stack

### Backend

| Layer | Technology |
|---|---|
| **Framework** | FastAPI 0.115 + Uvicorn |
| **ORM / DB Client** | Prisma Python 0.15 |
| **Database** | Neon PostgreSQL (serverless) |
| **Vector DB** | ChromaDB 0.6 |
| **Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`) |
| **LLM (Primary)** | OpenRouter API — `meta-llama/llama-3.3-70b-instruct` |
| **LLM (Fallback)** | Groq API — `llama-3.3-70b-versatile` |
| **Auth** | `python-jose` (JWT) + `passlib[bcrypt]` |
| **Rate Limiting** | slowapi |
| **Document Parsing** | PyPDF2, python-docx, openpyxl, python-pptx, unstructured |
| **Text Splitting** | langchain-text-splitters |
| **RAG Evaluation** | RAGAS |
| **Logging** | Loguru |
| **Testing** | Pytest + pytest-asyncio + HTTPX |

### Frontend

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16.2 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | Shadcn UI + Radix UI |
| **State / Data** | SWR 2.4 |
| **Forms** | React Hook Form + Zod |
| **Animations** | Framer Motion 12 |
| **Tables** | TanStack Table v8 |
| **Markdown** | react-markdown + remark-gfm |
| **Icons** | Lucide React |
| **Notifications** | Sonner |

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** (3.11 recommended)
- **Node.js 18+** and `npm`
- **Neon PostgreSQL** account — [console.neon.tech](https://console.neon.tech)
- **OpenRouter API Key** — [openrouter.ai](https://openrouter.ai)
- **Groq API Key** — [console.groq.com](https://console.groq.com)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 3. Install all dependencies
pip install -r requirements.txt

# 4. Copy and configure environment variables
cp .env.example .env
# → Edit .env with your DATABASE_URL, API keys, and SECRET_KEY

# 5. Push the Prisma schema to your Neon database and generate the client
npx prisma db push

# 6. Start the development server
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at:
- **API Base:** `http://localhost:8000/api`
- **Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc:** `http://localhost:8000/redoc`

---

### Frontend Setup

```bash
# 1. Navigate to the UI directory
cd ui

# 2. Install dependencies
npm install

# 3. Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 4. Start the development server (with Turbopack)
npm run dev
```

The dashboard will be available at `http://localhost:3000`.

---

### Docker (Full Stack)

Run the entire stack with a single command:

```bash
# From the project root
docker-compose up --build
```

| Service | Port | Description |
|---|---|---|
| `punchai_backend` | `8000` | FastAPI RAG Engine |
| `punchai_ui` | `3000` | Next.js Dashboard |

> **Note:** Persistent volumes are created automatically for `chroma_data`, `uploads_data`, and `logs_data`.

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `SECRET_KEY` | ✅ | JWT signing secret (use a long random string) |
| `OPENROUTER_API_KEY` | ✅ | Primary LLM provider key |
| `OPENROUTER_MODEL` | ✅ | Model ID (e.g. `meta-llama/llama-3.3-70b-instruct`) |
| `GROQ_API_KEY` | ✅ | Fallback LLM provider key |
| `GROQ_MODEL` | ✅ | Groq model ID (e.g. `llama-3.3-70b-versatile`) |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins (e.g. `http://localhost:3000`) |
| `APP_ENV` | ❌ | `development` or `production` (default: `development`) |
| `APP_PORT` | ❌ | Server port (default: `8000`) |

### Frontend (`ui/.env.local`)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | Backend API base URL (e.g. `http://localhost:8000`) |

---

## 📌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/signup` | None | Register a new user, returns JWT |
| `POST` | `/api/auth/login` | None | Login, returns JWT |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users/me` | JWT | Get current user profile |
| `PATCH` | `/api/users/me` | JWT | Update profile (name, etc.) |
| `POST` | `/api/users/me/avatar` | JWT | Upload profile avatar |

### Bots
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/bots/` | JWT | List all bots for current user |
| `POST` | `/api/bots/` | JWT | Create a new AI bot |
| `GET` | `/api/bots/{bot_id}` | JWT | Get a specific bot's details |
| `PATCH` | `/api/bots/{bot_id}` | JWT | Update bot configuration |
| `DELETE` | `/api/bots/{bot_id}` | JWT | Delete a bot and all its data |
| `GET` | `/api/bots/{bot_id}/api-key` | JWT | Retrieve the bot's embeddable API key |

### Data Sources
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/datasources/upload` | JWT | Upload PDF / Office file (indexed via Hybrid RAG) |
| `POST` | `/api/datasources/url` | JWT | Ingest a URL (scraped & indexed) |
| `POST` | `/api/datasources/faq` | JWT | Add manual FAQ entries |
| `GET` | `/api/datasources/{bot_id}` | JWT | List all data sources for a bot |
| `DELETE` | `/api/datasources/{source_id}` | JWT | Remove a data source |

### Dashboard Chat (Playground)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/chats/{bot_id}/message` | JWT | Send a message (streamed SSE response) |
| `GET` | `/api/chats/{bot_id}/history` | JWT | Retrieve conversation history |
| `DELETE` | `/api/chats/{bot_id}/history` | JWT | Clear conversation history |

### External Widget (API Key Auth)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/external/chat/init` | API Key | Initialize a new widget session |
| `POST` | `/api/external/chat/{session_id}/message/stream` | API Key | Streamed RAG response (SSE) |

### Utilities
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | None | Service health check |
| `GET` | `/` | None | API info and version |

---

## 🔄 The Hybrid RAG Pipeline

PunchAI uses a dual-retrieval strategy to maximize answer quality:

```
User Query
    │
    ▼
┌─────────────────────────────────────────────┐
│              Query Processing               │
│   Embed query with sentence-transformers    │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
        ▼                     ▼
┌─────────────┐       ┌───────────────────┐
│Vector Search│       │ Full-Text Search  │
│ (ChromaDB)  │       │ (PostgreSQL FTS)  │
│ Semantic /  │       │ Exact / Lexical   │
│ Conceptual  │       │ Pattern Matching  │
└──────┬──────┘       └────────┬──────────┘
       │                       │
       └──────────┬────────────┘
                  │
                  ▼
        ┌─────────────────┐
        │  Merge & Rank   │
        │ Deduplicate &   │
        │ score results   │
        └────────┬────────┘
                 │
                 ▼
    ┌────────────────────────┐
    │ LLM Generation (SSE)   │
    │ OpenRouter → Groq      │
    │ (automatic fallback)   │
    └────────────────────────┘
                 │
                 ▼
      Streamed Response → UI
```

**Ingestion Flow:**
1. **Extract** — Parse PDF/URL/Office/FAQ into raw text
2. **Chunk** — Split text using `langchain-text-splitters` (semantic chunking)
3. **Sync** — Store chunks simultaneously in:
   - **ChromaDB** (vector embeddings for semantic search)
   - **PostgreSQL** (full-text indexed for keyword search)
4. **Ready** — Bot is immediately queryable

---

## 📊 Dashboard Pages

| Route | Page | Description |
|---|---|---|
| `/dashboard` | **Overview** | Stats (bots, data sources), quick actions, recent bots |
| `/dashboard/chatbot` | **My Bots** | Create, view, manage all AI bots |
| `/dashboard/chatbot/[id]` | **Bot Detail** | Configure bot, view settings & API key |
| `/dashboard/chatbot/[id]/Playground` | **Playground** | Real-time chat interface with RAG context panel |
| `/dashboard/dataSource` | **Data Sources** | Upload files, add URLs, manage FAQ entries |
| `/dashboard/chatlogs` | **Chat Logs** | Historical conversations across all bots |
| `/dashboard/account` | **Account** | Profile settings, avatar, preferences |

---

## 🎨 Design System

PunchAI follows an **Industrial-Grade, Premium, Minimalist** design philosophy.

- **Theme:** Dark-first with OKLCH color values for perceptual uniformity
- **Fonts:** [Inter](https://fonts.google.com/specimen/Inter) / [Geist Sans](https://vercel.com/font/sans) (UI) + [Geist Mono](https://vercel.com/font/mono) (code/logs)
- **Base Radius:** `0.45rem`
- **Key Colors:**

| Token | Value | Usage |
|---|---|---|
| `--background` | `oklch(0.141 0.005 285.823)` | Deep charcoal surface |
| `--foreground` | `oklch(0.985 0 0)` | High-contrast white text |
| `--primary` | `oklch(0.92 0.004 286.32)` | Primary actions |
| `--border` | `oklch(1 0 0 / 10%)` | Delicate semi-transparent borders |
| `--destructive` | `oklch(0.704 0.191 22.216)` | Danger / delete actions |

> See [`design.md`](./design.md) for the full design system specification.

---

## 🗺️ Development Roadmap

| Phase | Status | Description |
|---|---|---|
| **Phase 1** — Performance & Tech Debt | ✅ Done | Bundle cleanup, auth skeleton, SWR caching, asset optimization |
| **Phase 2** — Advanced RAG | ✅ Done | Multi-format ingestion, GraphRAG exploration, RAGAS evaluation |
| **Phase 3** — User & Admin Tools | ✅ Done | Context panel in playground, widget customizer, HITL feedback |
| **Phase 4** — Analytics & Insights | 🔄 Planned | Sentiment heatmaps, knowledge gap analysis, token usage monitoring |
| **Phase 5** — Production Hardening | 🔄 Planned | Tiered rate limiting, Prometheus/Grafana health monitoring |

---

## 🧪 Running Tests

```bash
cd backend
source .venv/bin/activate

# Run the full test suite
pytest tests/ -v

# Run RAGAS RAG quality evaluation
pytest tests/test_rag.py -v
```

---

## 📄 License

This project was built as part of an OJT (On-the-Job Training) programme.

---

*Built with ❤️ using FastAPI, Next.js, ChromaDB, and PostgreSQL.*
