---
trigger: always_on
---

# Project Structure

```
better-runway/
├── api/
│   └── index.py                     # Vercel serverless entry point
├── backend/
│   ├── app/
│   │   ├── __init__.py              # Flask app factory
│   │   ├── db.py                    # Supabase client initialization
│   │   ├── routes/
│   │   │   ├── __init__.py          # Blueprint registration
│   │   │   ├── scopes.py            # /api/v1/scopes endpoints
│   │   │   ├── projects.py          # /api/v1/projects endpoints
│   │   │   ├── milestones.py        # /api/v1/milestones endpoints
│   │   │   └── search.py            # /api/v1/search endpoint
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── llm_service.py       # All Gemini API calls (structured output)
│   │   │   ├── scope_service.py     # Scope generation & conversion logic
│   │   │   └── summary_service.py   # Weekly summary generation logic
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── prompt_builder.py    # LLM prompt templates
│   │       └── validators.py        # Input validation helpers
│   ├── config.py                    # Config class (Dev / Prod)
│   ├── requirements.txt             # Python dependencies
│   └── run.py                       # Entry point: python run.py
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── store/
│   │   ├── lib/
│   │   ├── types/
│   │   ├── App.tsx                  # Router setup
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Tailwind v4
│   ├── package.json
│   └── vite.config.ts
│
├── .agent/
│   ├── rules/                       # Antigravity workspace rules
│   └── workflows/
|   |__ skills/               # Antigravity workflows
│
├── vercel.json                      # Vercel deployment config
├── AGENTS.md                        # Root agent instructions
├── runway_product_spec.md           # Product specification
└── README.md
```

## Naming Conventions

| Context                    | Convention                           | Example                    |
| -------------------------- | ------------------------------------ | -------------------------- |
| Python files               | `snake_case.py`                      | `scope_service.py`         |
| Python variables/functions | `snake_case`                         | `generate_scope()`         |
| Python classes             | `PascalCase`                         | `ScopeOutputSchema`        |
| TS/React components        | `PascalCase.tsx`                     | `EpicCard.tsx`             |
| TS hooks                   | `kebab-case.ts` starting with `use-` | `use-projects.ts`          |
| TS utilities               | `kebab-case.ts`                      | `utils.ts`                 |
| TS types/interfaces        | `PascalCase`                         | `interface Milestone`      |
| CSS classes                | `kebab-case`                         | `.milestone-card`          |
| API routes                 | `kebab-case`                         | `/api/v1/user-stories/:id` |
| DB tables                  | `snake_case` (plural)                | `user_stories`             |
| DB columns                 | `snake_case`                         | `is_completed`             |
| Environment variables      | `SCREAMING_SNAKE_CASE`               | `SUPABASE_URL`             |
