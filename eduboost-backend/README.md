# EduBoost Backend

FastAPI backend for EduBoost.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Optional email/RAG config:

```bash
cp .env.example .env
```

Fill SMTP values in `.env` if you want real emails for signup, approval, rejection, and password reset.

## Run

```bash
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open API docs:

```text
http://127.0.0.1:8000/docs
```

Default admin account:

```text
username: admin
password: admin123
```

## Assistant Interface

The standalone assistant UI is served by the backend:

```text
http://127.0.0.1:8000/assistant/
```

## Notes

- Do not commit `.env`, `eduboost.db`, `venv`, or `chroma_db`.
- The database is created automatically on startup.
