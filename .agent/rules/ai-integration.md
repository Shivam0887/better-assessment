---
trigger: always_on
description: Use this rule when working with the AI integration with Flask backend
---

# AI / LLM Integration — Gemini 2.5 Flash

## SDK Setup

Use the `google-genai` Python SDK with structured output support.

```python
# services/llm_service.py
from google import genai
from google.genai import types
import os

client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
MODEL = "gemini-2.5-flash"
```

## Structured Output for Scope Generation

Use Gemini's structured output mode with Pydantic schemas to guarantee parseable responses:

```python
from pydantic import BaseModel

class UserStorySchema(BaseModel):
    title: str
    description: str
    order_index: int

class EpicSchema(BaseModel):
    name: str
    description: str
    effort_days: int
    order_index: int
    user_stories: list[UserStorySchema]

class RiskSchema(BaseModel):
    description: str
    severity: str  # "high" | "medium" | "low"

class ScopeOutputSchema(BaseModel):
    epics: list[EpicSchema]
    suggested_stack: list[str]
    timeline_weeks: int
    risks: list[RiskSchema]

def generate_scope(product_name: str, idea_text: str, **context) -> ScopeOutputSchema:
    """Generate structured scope from idea using Gemini with structured output."""
    response = client.models.generate_content(
        model=MODEL,
        contents=build_scope_prompt(product_name, idea_text, **context),
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ScopeOutputSchema,
            temperature=0.7,
        ),
    )
    return response.parsed
```

## Regular Text Output for Summaries

Weekly summaries are prose — use regular (non-structured) output:

```python
def generate_summary(project_context: str, tone: str) -> str:
    """Generate weekly summary — returns plain text prose."""
    response = client.models.generate_content(
        model=MODEL,
        contents=build_summary_prompt(project_context, tone),
        config=types.GenerateContentConfig(
            temperature=0.7,
        ),
    )
    return response.text
```

## Error Handling

- Wrap every LLM call in `try/except`. Catch `google.genai.errors.APIError` and network errors.
- Set a **timeout of 30 seconds** on requests.
- If structured output fails, retry **once** with a clarifying message.
- If retry fails, return HTTP 500 with `"AI generation failed — please try again"`.
- Log all LLM inputs/outputs to `llm_debug.log` during development.
- Rate limit / API quota errors → return HTTP 503 with a clear message.

## When to Use Structured vs Regular Output

| Use Case                            | Output Mode                      | Reason                                         |
| ----------------------------------- | -------------------------------- | ---------------------------------------------- |
| Scope generation                    | **Structured** (Pydantic schema) | Must parse into epics, stories, risks reliably |
| Scope-to-project conversion context | **Structured**                   | Needs reliable JSON for DB inserts             |
| Weekly summary                      | **Regular text**                 | Prose output, no parsing needed                |
