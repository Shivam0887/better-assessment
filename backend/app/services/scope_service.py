"""Scope generation, CRUD, and scope-to-project conversion logic."""

from datetime import date, timedelta
from typing import Any

from app.db import supabase
from app.services.llm_service import generate_scope, ScopeOutputSchema
from app.utils.prompt_builder import build_scope_prompt, SCOPE_SYSTEM_PROMPT


def create_scope(
    product_name: str,
    idea_text: str,
    target_audience: str | None = None,
    budget_range: str | None = None,
    timeline_pressure: str | None = None,
) -> dict[str, Any]:
    """Call LLM, persist scope + epics + user stories, return full scope."""

    # Build prompt and call Gemini
    user_prompt = build_scope_prompt(
        product_name, idea_text, target_audience, budget_range, timeline_pressure
    )
    ai_output: ScopeOutputSchema = generate_scope(SCOPE_SYSTEM_PROMPT, user_prompt)

    # Persist scope row
    scope_data = {
        "product_name": product_name,
        "idea_text": idea_text,
        "target_audience": target_audience,
        "budget_range": budget_range,
        "timeline_pressure": timeline_pressure,
        "ai_output_raw": ai_output.model_dump(),
        "suggested_stack": [s for s in ai_output.suggested_stack],
        "timeline_weeks": ai_output.timeline_weeks,
        "risks": [r.model_dump() for r in ai_output.risks],
        "status": "draft",
    }
    scope_result = supabase.table("scopes").insert(scope_data).execute()
    scope = scope_result.data[0]

    # Persist epics + user stories
    epics_out = []
    for epic_schema in ai_output.epics:
        epic_data = {
            "scope_id": scope["id"],
            "name": epic_schema.name,
            "description": epic_schema.description,
            "effort_days": epic_schema.effort_days,
            "order_index": epic_schema.order_index,
        }
        epic_result = supabase.table("epics").insert(epic_data).execute()
        epic = epic_result.data[0]

        stories_out = []
        for story_schema in epic_schema.user_stories:
            story_data = {
                "epic_id": epic["id"],
                "title": story_schema.title,
                "description": story_schema.description,
                "is_completed": False,
                "order_index": story_schema.order_index,
            }
            story_result = (
                supabase.table("user_stories").insert(story_data).execute()
            )
            stories_out.append(story_result.data[0])

        epic["user_stories"] = stories_out
        epics_out.append(epic)

    scope["epics"] = epics_out
    return scope


def get_scope(scope_id: str) -> dict[str, Any] | None:
    """Fetch a scope with its epics and user stories."""
    result = (
        supabase.table("scopes")
        .select("*, epics(*, user_stories(*))")
        .eq("id", scope_id)
        .single()
        .execute()
    )
    return result.data


def list_scopes() -> list[dict[str, Any]]:
    """List all scopes (summary fields only)."""
    result = (
        supabase.table("scopes")
        .select("id, product_name, idea_text, status, created_at")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def update_scope(scope_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update allowed scope fields."""
    allowed = {"product_name", "idea_text", "target_audience", "status"}
    filtered = {k: v for k, v in updates.items() if k in allowed}
    result = (
        supabase.table("scopes").update(filtered).eq("id", scope_id).execute()
    )
    return result.data[0] if result.data else {}


def archive_scope(scope_id: str) -> dict[str, Any]:
    """Soft-delete by setting status to archived."""
    return update_scope(scope_id, {"status": "archived"})


def convert_scope_to_project(
    scope_id: str, start_date_str: str | None = None
) -> dict[str, Any]:
    """Convert a scope into a project with milestones and user stories.

    Creates:
    - 1 project row
    - N milestone rows (one per epic)
    - Copies user_stories with milestone_id set
    - Auto-calculates start/due dates from cumulative effort_days
    """
    scope = get_scope(scope_id)
    if not scope:
        raise ValueError("Scope not found")
    if scope.get("status") == "converted":
        raise ValueError("Scope already converted")

    project_start = (
        date.fromisoformat(start_date_str)
        if start_date_str
        else date.today()
    )

    # Create the project
    project_data = {
        "scope_id": scope_id,
        "name": scope["product_name"],
        "description": scope["idea_text"][:500],
        "start_date": project_start.isoformat(),
        "status": "active",
    }
    project_result = supabase.table("projects").insert(project_data).execute()
    project = project_result.data[0]

    # Create milestones from epics
    epics = sorted(scope.get("epics", []), key=lambda e: e.get("order_index", 0))
    current_start = project_start
    milestones_out = []

    for idx, epic in enumerate(epics):
        effort_days = epic.get("effort_days", 7)
        milestone_due = current_start + timedelta(days=effort_days)

        milestone_data = {
            "project_id": project["id"],
            "epic_id": epic["id"],
            "name": epic["name"],
            "description": epic.get("description", ""),
            "status": "not_started",
            "progress_percent": 0,
            "start_date": current_start.isoformat(),
            "due_date": milestone_due.isoformat(),
            "order_index": idx,
        }
        ms_result = (
            supabase.table("milestones").insert(milestone_data).execute()
        )
        milestone = ms_result.data[0]

        # Copy user stories with milestone_id
        stories = epic.get("user_stories", [])
        for story in stories:
            supabase.table("user_stories").update(
                {"milestone_id": milestone["id"]}
            ).eq("id", story["id"]).execute()

        milestone["user_stories"] = stories
        milestones_out.append(milestone)
        current_start = milestone_due

    # Mark scope as converted
    supabase.table("scopes").update({"status": "converted"}).eq(
        "id", scope_id
    ).execute()

    project["milestones"] = milestones_out
    return project
