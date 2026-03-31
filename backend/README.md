# PunchAI Backend (RAG Engine)

A high-performance **Retrieval-Augmented Generation (RAG)** backend built with **FastAPI**, **Prisma Client Python**, **ChromaDB**, and **Ollama**.

---

## 📁 Updated Project Structure

```
backend/
├── chroma_db/             # Persistent Vector Database
├── uploads/               # Local PDF storage (for indexing)
├── prisma/
│   └── schema.prisma      # DB Schema (User, Bot, Faq, DocumentChunk, Chat)
├── app/
│   ├── main.py            # FastAPI Entry Point
│   ├── core/
│   │   ├── config.py      # App Settings / Env
│   │   ├── database.py    # Prisma SQL Client
│   │   ├── security.py    # JWT Auth & Bcrypt Hashing
│   │   ├── vector_store.py# ChromaDB Client
│   │   └── deps.py        # Auth Middleware (Depends)
│   ├── api/
│   │   └── routes/
│   │       ├── auth.py    # Signup / Login
│   │       ├── bots.py    # Managed AI Bots
│   │       ├── datasources# PDF / URL / FAQ Ingestion
│   │       ├── chats.py   # RAG-powered Chat Interface
│   │       └── health.py  # Service Health Check
│   ├── services/
│   │   ├── processor.py   # Clean -> Chunk -> Embed -> Store Pipeline
│   │   └── llm.py         # Local LLM (Ollama) Interface
│   ├── utils/
│   │   └── extractor.py   # Specialized Text Extractors
│   ├── schemas/           # Pydantic Data Models
├── requirements.txt
├── .env                   # Configuration
└── .gitignore
```

---

## 🚀 The RAG Pipeline

1.  **Ingest**: PDFs (extracted via PyPDF2), URLs (BeautifulSoup), or FAQs.
2.  **Clean**: Specialized logic per source (removes website nav/ads, PDF headers, etc.).
3.  **Store Raw**: Full text is archived in **Neon PostgreSQL** for reference.
4.  **Index**: Text is chunked (1000 chars) and embedded using **SentenceTransformers** into **ChromaDB**.
5.  **Query**: On user message, the most relevant context is retrieved from ChromaDB.
6.  **Generate**: Context + Bot Persona + User Query are sent to **Local Ollama (Llama 3)** to produce a grounded response.

---

## 🛠️ Setup & Running

### 1. Prerequisites

- **Python 3.11+**
- **Neon PostgreSQL URL** (Get it at [neon.tech](https://neon.tech))
- **Ollama** installed locally (Get it at [ollama.com](https://ollama.com))

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in:
```env
DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require"
SECRET_KEY="your-secure-random-string"
```

### 3. Install & Initialize

```bash
cd backend

# Create & activate environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Sync database & generate Prisma client
prisma db push
prisma generate

# Pull your LLM model
ollama pull llama3
```

### 4. Run Server

```bash
uvicorn app.main:app --reload --port 8000
```
Visit **http://localhost:8000/docs** for the Swagger UI.

---

## 📌 Core API Endpoints

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/signup` | Register new user + JWT |
| | `POST` | `/api/auth/login` | Login + JWT |
| **Bots** | `POST` | `/api/bots/` | Create minimalist RAG Bot |
| | `GET` | `/api/bots/{id}` | Get bot with owner info |
| **Data** | `POST` | `/api/datasources/upload` | Upload PDF (Auto-Index) |
| | `POST` | `/api/datasources/url` | Scrape Website (Auto-Index) |
| | `POST` | `/api/datasources/faq` | Batch Upload FAQs (Auto-Index) |
| | `GET` | `/api/datasources/faqs` | List/Manage individual FAQs |
| **Chat** | `POST` | `/api/chats/{id}/messages` | RAG query loop (Retreive -> LLM) |

---

## 🔒 Security
- Every bot and data action requires a valid **JWT Token**.
- Users can only access/modify bots and data that they own.
- Passwords are encrypted using **Bcrypt**.

---

## 💎 Dependencies
- **Core**: FastAPI, Uvicorn, Prisma
- **ML/AI**: ChromaDB, SentenceTransformers (all-MiniLM-L6-v2), LangChain (Text Splitters)
- **Extraction**: PyPDF2, BeautifulSoup4, Requests
- **Auth**: Passlib (Bcrypt), Python-Jose (JWT)
