"""Weekly summary generation logic."""

from datetime import date, timedelta
from typing import Any

from app.db import supabase
from app.services.llm_service import generate_summary as llm_generate_summary
from app.utils.prompt_builder import build_summary_prompt


def generate_summary(project_id: str, tone: str = "executive") -> dict[str, Any]:
    """Gather last 7 days of updates, call LLM, persist and return summary."""

    # Fetch project
    project = (
        supabase.table("projects")
        .select("id, name, description")
        .eq("id", project_id)
        .single()
        .execute()
    ).data

    # Fetch milestones with statuses
    milestones = (
        supabase.table("milestones")
        .select("id, name, status, progress_percent, due_date")
        .eq("project_id", project_id)
        .order("order_index")
        .execute()
    ).data

    # Fetch updates from the last 7 days
    week_start = date.today() - timedelta(days=7)
    milestone_ids = [m["id"] for m in milestones]

    updates: list[dict[str, Any]] = []
    if milestone_ids:
        updates = (
            supabase.table("updates")
            .select("*, milestones!inner(name)")
            .in_("milestone_id", milestone_ids)
            .gte("logged_at", week_start.isoformat())
            .order("logged_at", desc=True)
            .execute()
        ).data

    # Format milestone statuses for prompt
    milestone_statuses = "\n".join(
        f"- {m['name']}: {m['status']} ({m['progress_percent']}% done, due {m['due_date']})"
        for m in milestones
    )

    # Format updates for prompt
    updates_formatted = "\n".join(
        f"- [{u.get('milestones', {}).get('name', 'Unknown')}] "
        f"({u['update_type']}) {u['content']}"
        for u in updates
    ) or "No updates logged this week."

    # Build prompts and call LLM
    system_prompt, user_prompt = build_summary_prompt(
        project_name=project["name"],
        description=project.get("description", ""),
        week_start=week_start.isoformat(),
        milestone_statuses=milestone_statuses,
        updates_formatted=updates_formatted,
        tone=tone,
    )
    content = llm_generate_summary(system_prompt, user_prompt)

    # Persist the summary
    summary_data = {
        "project_id": project_id,
        "content": content,
        "tone": tone,
        "week_start": week_start.isoformat(),
    }
    result = supabase.table("summaries").insert(summary_data).execute()
    return result.data[0]
