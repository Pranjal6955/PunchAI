# PunchAI Backend Documentation

This document provides a detailed overview of the backend technologies, architecture, and core components of the PunchAI platform.

## 🚀 Technology Stack

The backend is built with high-performance, modern Python frameworks and AI-focused libraries.

### Core Frameworks
- **FastAPI (v0.115+)**: A modern, fast (high-performance) web framework for building APIs with Python 3.10+ based on standard Python type hints.
- **Prisma (v0.15.0)**: Used as the primary ORM for database management, providing type-safe database queries.
- **Pydantic (v2.10+)**: Employed for data validation and settings management using Python type annotations.
- **Loguru**: For structured, readable, and asynchronous logging.
- **Slowapi**: For implementing rate limiting across API endpoints.

### AI & RAG (Retrieval-Augmented Generation)
- **Hybrid Search Engine**: Combines Vector Search (ChromaDB) and Keyword Search (PostgreSQL Full-Text Search) for maximum accuracy.
- **ChromaDB (v0.6.3)**: Used for storing and retrieving document embeddings for the semantic search pipeline.
- **Sentence-Transformers (v3.3.1)**: Used for generating dense vector representations (embeddings) of text locally.
- **AsyncOpenAI & AsyncGroq**: Asynchronous SDKs for multiple LLM providers (GPT-4o, Llama 3 via Groq) with intelligent fallbacks.
- **LangChain Text Splitters**: Used for intelligent chunking of large documents to improve retrieval accuracy.

### Document & Web Processing
- **PyPDF2**: For extracting text from PDF files.
- **BeautifulSoup4 & Requests**: For web scraping and text extraction from URLs.

### Security & Authentication
- **JOSE (python-jose)**: For generating and verifying JSON Web Tokens (JWT).
- **Passlib (bcrypt)**: For secure password hashing.
- **FastAPI Security**: For handling OAuth2 password flow and dependency injection for current users.

---

## 🏗️ System Architecture

The project follows a modular architecture designed for scalability and maintainability.

### Project Structure
```text
backend/
├── app/
│   ├── api/                # API Routing and Controller logic
│   │   ├── routes/         # Endpoint definitions (auth, bots, external, etc.)
│   │   └── deps.py         # Shared dependencies (DB, Auth, API Keys)
│   ├── core/               # Global configurations and client initializations
│   │   ├── config.py       # Environment variables & Settings
│   │   ├── database.py     # Prisma DB connection
│   │   ├── security.py     # JWT & Hashing logic
│   │   ├── vector_store.py # ChromaDB client & search logic
│   │   ├── limiter.py      # Rate limiting configuration
│   │   └── logging.py      # Structured Loguru configuration
│   ├── schemas/            # Pydantic models for Request/Response validation
│   ├── services/           # Business logic and external integrations
│   │   ├── llm.py          # Asynchronous LLM orchestration (OpenRouter/Groq)
│   │   └── processor.py    # Hybrid Search (Vector + FTS) & Chunking logic
│   ├── utils/              # Helper functions and decorators
│   └── main.py             # FastAPI entry point
├── prisma/                 # Database schema and migrations
├── chroma_db/              # Persistent vector store data
├── uploads/                # Temporary storage for uploaded documents
└── tests/                  # Integration and unit tests
```

### Core Components

#### 1. API Layer (`app/api/`)
- **Internal API**: Manages dashboard operations (Auth, Bots, Chats, Datasources).
- **External API (`/api/external`)**: Specialized routes for the embeddable widget, using API Key authentication and supporting anonymous chat sessions.
- **Rate Limiting**: Critical endpoints (like message sending) are protected by `slowapi` to prevent abuse.

#### 2. Service Layer (`app/services/`)
- **LLM Service**: Handles asynchronous response generation and real-time streaming (SSE). Implements a fallback mechanism from OpenRouter to Groq.
- **Processor Service**: The core of the RAG pipeline. It cleans text, chunks it, and synchronizes it across both Postgres (for FTS) and ChromaDB (for embeddings).

#### 3. Data Store Layer
- **PostgreSQL**: Stores relational data (users, bots, messages) and provides **Full-Text Search (FTS)** capabilities using `to_tsvector`.
- **ChromaDB**: Manages high-dimensional vector embeddings for semantic retrieval.

---

## 🔄 Hybrid RAG Workflow

PunchAI utilizes a unique Hybrid Retrieval system to ground AI responses:

1. **Ingestion**: Text is extracted from PDFs or URLs and sanitized.
2. **Dual Storage**:
   - **SQL**: Text chunks are stored in Postgres for high-speed keyword matching.
   - **Vector**: Chunks are embedded via `all-MiniLM-L6-v2` and stored in ChromaDB.
3. **Hybrid Retrieval**: When a query arrives, the system triggers:
   - **Semantic Search**: To find conceptual similarity.
   - **Keyword Search**: To find exact matches for names, codes, or specific terms.
4. **Ranking & Deduplication**: Results are combined and deduplicated to give the LLM the best possible context.
5. **Streaming Generation**: The LLM generates a response which is streamed to the user in real-time using **Server-Sent Events (SSE)**.

---

## 🛠️ Setup & Development

- **DB Migrations**: Performed via `npx prisma db push`.
- **Dev Server**: Run with `uvicorn app.main:app --reload`.
- **Async Execution**: The system uses `run_in_threadpool` for CPU-bound tasks (like encoding) and native `async/await` for I/O bound tasks (API calls, DB queries) to ensure the event loop remains responsive.

