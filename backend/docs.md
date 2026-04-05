# PunchAI Backend Documentation

This document provides a detailed overview of the backend technologies, architecture, and core components of the PunchAI platform.

## 🚀 Technology Stack

The backend is built with high-performance, modern Python frameworks and AI-focused libraries.

### Core Frameworks
- **FastAPI (v0.115+)**: A modern, fast (high-performance) web framework for building APIs with Python 3.10+ based on standard Python type hints.
- **Prisma (v0.15.0)**: Used as the primary ORM for database management, providing type-safe database queries.
- **Pydantic (v2.10+)**: Employed for data validation and settings management using Python type annotations.

### AI & RAG (Retrieval-Augmented Generation)
- **ChromaDB (v0.6.3)**: An open-source vector database used for storing and retrieving document embeddings for the RAG pipeline.
- **Sentence-Transformers (v3.3.1)**: Used for generating dense vector representations (embeddings) of text locally.
- **OpenAI & Groq SDKs**: Support for multiple LLM providers (GPT-4o, Llama 3 via Groq) for high-speed inference.
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
│   │   ├── routes/         # Endpoint definitions (auth, bots, chats, etc.)
│   │   └── deps.py         # Shared dependencies (DB, Auth)
│   ├── core/               # Global configurations and client initializations
│   │   ├── config.py       # Environment variables & Settings
│   │   ├── database.py     # Prisma DB connection
│   │   ├── security.py     # JWT & Hashing logic
│   │   └── vector_store.py # ChromaDB client & search logic
│   ├── schemas/            # Pydantic models for Request/Response validation
│   ├── services/           # Business logic and external integrations
│   │   ├── llm.py          # LLM orchestration (OpenAI/Groq)
│   │   └── processor.py    # Document/URL processing & chunking
│   ├── utils/              # Helper functions and decorators
│   └── main.py             # FastAPI entry point
├── prisma/                 # Database schema and migrations
├── chroma_db/              # Persistent vector store data
├── uploads/                # Temporary storage for uploaded documents
└── tests/                  # Integration and unit tests
```

### Core Components

#### 1. API Layer (`app/api/`)
- **Auth**: Manages user registration and login using JWT.
- **Bots**: CRUD operations for managing AI agents.
- **Chats**: The core chat interface. It handles conversation history and the AI response loop.
- **Datasources**: Handles the ingestion of PDFs, URLs, and manually entered FAQs.

#### 2. Service Layer (`app/services/`)
- **LLM Service**: Abstracts the connection to various AI models. It handles prompt engineering and response streaming.
- **Processor Service**: Responsible for cleaning raw text and splitting it into manageable chunks using Recursive Character Text Splitters.

#### 3. Vector Store Layer (`app/core/vector_store.py`)
- Manages the interaction with ChromaDB.
- Handles the conversion of text chunks into embeddings before storage.
- Performs semantic search to retrieve the most relevant context for a given user query.

---

## 🔄 RAG Workflow

PunchAI utilizes a Retrieval-Augmented Generation pipeline to ground AI responses in specific knowledge:

1. **Ingestion**: A user provides a source (PDF/URL).
2. **Extraction**: The `Processor` extracts text and splits it into small, overlapping chunks.
3. **Embedding**: The `VectorStore` converts these chunks into 384-dimensional vectors using `all-MiniLM-L6-v2`.
4. **Storage**: Vectors are stored in a collection specific to the chatbot in ChromaDB.
5. **Retrieval**: When a user chats with the bot, the system searches ChromaDB for the top-K chunks most similar to the user's question.
6. **Augmentation**: The retrieved chunks are injected into a specialized prompt as "Context".
7. **Generation**: The LLM (OpenAI or Groq) generates a response based *only* on the provided context if possible.

---

## 🛠️ Setup & Development

Detailed setup instructions can be found in the `README.md`.
- **DB Migrations**: Performed via `prisma db push`.
- **Dev Server**: Run with `uvicorn app.main:app --reload`.
- **Environment**: Configuration is managed via the `.env` file.
