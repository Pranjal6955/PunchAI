# PunchAI Backend

REST API built with **FastAPI**, **Prisma Client Python**, and **Neon PostgreSQL**.

---

## 📁 Project Structure

```
backend/
├── prisma/
│   └── schema.prisma        # Database schema (models, enums, relations)
├── app/
│   ├── main.py               # FastAPI application entry point
│   ├── core/
│   │   ├── config.py          # Environment / settings
│   │   └── database.py        # Prisma client singleton
│   ├── api/
│   │   └── routes/
│   │       ├── health.py      # GET /health
│   │       ├── users.py       # CRUD /api/users
│   │       ├── bots.py        # CRUD /api/bots
│   │       ├── datasources.py # CRUD /api/datasources
│   │       └── chats.py       # CRUD /api/chats + messages
│   ├── schemas/               # Pydantic request/response models
│   ├── services/              # Business logic (future)
│   └── utils/                 # Helpers (future)
├── requirements.txt
├── .env                       # Local env vars (not committed)
├── .env.example               # Template for env vars
└── .gitignore
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Python 3.11+
- A [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Node.js 18+ (required by Prisma CLI)

### 2. Clone & Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Configure Environment

Copy the example env file and fill in your **Neon database URL**:

```bash
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL="postgresql://neondb_owner:<password>@<host>.neon.tech/neondb?sslmode=require"
```

> 💡 Get your connection string from [Neon Console](https://console.neon.tech) → your project → Connection Details.

### 4. Push Schema to Neon & Generate Client

```bash
# Push the Prisma schema to your Neon database
prisma db push

# Generate the Prisma Python client
prisma generate
```

### 5. Run the Server

```bash
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000/docs** for the interactive Swagger UI.

---

## 📌 API Endpoints

| Method   | Endpoint                       | Description              |
|----------|--------------------------------|--------------------------|
| `GET`    | `/health`                      | Health check + DB status |
| `POST`   | `/api/users`                   | Create user              |
| `GET`    | `/api/users`                   | List users (paginated)   |
| `GET`    | `/api/users/:id`               | Get user by ID           |
| `PATCH`  | `/api/users/:id`               | Update user              |
| `DELETE` | `/api/users/:id`               | Delete user              |
| `POST`   | `/api/bots`                    | Create bot               |
| `GET`    | `/api/bots`                    | List bots                |
| `GET`    | `/api/bots/:id`                | Get bot by ID            |
| `PATCH`  | `/api/bots/:id`                | Update bot               |
| `DELETE` | `/api/bots/:id`                | Delete bot               |
| `POST`   | `/api/datasources`             | Create data source       |
| `GET`    | `/api/datasources?botId=`      | List sources for bot     |
| `GET`    | `/api/datasources/:id`         | Get source by ID         |
| `PATCH`  | `/api/datasources/:id`         | Update source            |
| `DELETE` | `/api/datasources/:id`         | Delete source            |
| `POST`   | `/api/chats`                   | Start new chat           |
| `GET`    | `/api/chats?userId=`           | List user's chats        |
| `GET`    | `/api/chats/:id`               | Get chat + messages      |
| `DELETE` | `/api/chats/:id`               | Delete chat              |
| `POST`   | `/api/chats/:id/messages`      | Add message to chat      |
| `GET`    | `/api/chats/:id/messages`      | List chat messages       |

---

## 🗄️ Database Models

- **User** — platform users
- **Bot** — AI agents with system prompts
- **DataSource** — files/URLs/text linked to bots  
- **Chat** — conversations between a user and a bot
- **Message** — individual messages within a chat

---

## 🛠️ Development

```bash
# Re-generate client after schema changes
prisma generate

# Apply schema changes to database
prisma db push

# Open Prisma Studio (visual DB browser)
prisma studio
```
