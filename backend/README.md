# PunchAI Backend 🧤

FastAPI-powered backend for **PunchAI**, featuring Prisma for Python and Neon DB integration.

## 🚀 Features
- **FastAPI**: High-performance, production-ready REST API.
- **Prisma**: Type-safe database access with Python.
- **Neon DB**: Scalable PostgreSQL for serverless apps.
- **Authentication**: JWT-based auth with secure password hashing.

---

## 🛠️ Setup Instructions

### 1. Prerequisites
- Python 3.9+
- A Neon DB project (PostgreSQL)

### 2. Configure Environment Variables
Copy the template and add your credentials:
```bash
cp .env.example .env  # If .env doesn't exist yet
```
Edit `.env` and provide your Neon connection string:
```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
SECRET_KEY="your-super-secret-key"
```

### 3. Install Dependencies
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 4. Database Setup (Prisma)
Sync your schema and generate the Python client:
```bash
prisma db push
prisma generate
```

### 5. Start development server
```bash
uvicorn app.main:app --reload
```
The API will be available at: [http://localhost:8000](http://localhost:8000)
Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure
- `app/api/endpoints`: Routing logic (auth, etc.).
- `app/core`: Security and configuration.
- `app/db`: Prisma client initialization.
- `app/schemas`: Pydantic models for validation.
- `prisma/`: Database schema definition.

## 🔒 Authentication Flow
1. **Signup**: `POST /api/auth/signup`
2. **Login**: `POST /api/auth/login` (Returns JWT)
3. **Protected Route**: Use the Bearer Token in `Authorization` header for `GET /api/auth/me`.
