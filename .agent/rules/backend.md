---
trigger: always_on
---

# Backend Guidelines

## Flask Conventions

- Use the **app factory pattern** in `app/__init__.py`.
- Register all routes as **Flask Blueprints** with the `/api/v1/` prefix.
- All endpoints return JSON. Use `jsonify()` for responses.
- Error responses follow: `{ "error": "message", "code": 400 }`.
- Use `@app.errorhandler` for global error handling (400, 404, 500).

```python
# app/__init__.py — Example factory
from flask import Flask
from flask_cors import CORS

def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(f"config.{config_name}")
    CORS(app)

    from app.routes import register_blueprints
    register_blueprints(app)

    return app
```

## Vercel Entry Point

The application is deployed via Vercel Serverless Functions. The entry point is located at `/api/index.py` at the project root, which imports the Flask factory.

## Supabase Client

- Initialize the Supabase client **once** in `app/db.py` using environment variables.
- Import and reuse the client instance across services and routes.
- Do NOT use SQLAlchemy or Flask-Migrate — Supabase handles the schema.
- Manage table schemas through the **Supabase Dashboard** (SQL editor or Table editor).

```python
# app/db.py
import os
from supabase import create_client, Client

supabase: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_KEY"]
)
```

## Supabase Query Patterns

```python
# SELECT
result = supabase.table("scopes").select("*").eq("id", scope_id).single().execute()

# INSERT
result = supabase.table("scopes").insert(data).execute()

# UPDATE
result = supabase.table("scopes").update(data).eq("id", scope_id).execute()

# DELETE (soft delete via status update preferred)
result = supabase.table("scopes").update({"status": "archived"}).eq("id", scope_id).execute()

# JOIN-like queries (use select with foreign key relations)
result = supabase.table("scopes").select("*, epics(*, user_stories(*))").eq("id", scope_id).execute()
```

## Environment Variables

Store in a `.env` file at `backend/.env` (gitignored). Load with `python-dotenv`.

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGci...
GEMINI_API_KEY=AIza...
FLASK_ENV=development
FLASK_DEBUG=1
```

## Python Code Style

- Use **snake_case** for variables, functions, modules.
- Use **PascalCase** for classes only.
- Type hints on all function signatures.
- Docstrings on service functions (one-liner minimum).
- Keep route handlers thin — delegate logic to `services/`.
- Maximum function length: ~40 lines. Extract helpers beyond that.
