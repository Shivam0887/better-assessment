"""LLM prompt templates for scope generation and weekly summaries."""


def build_scope_prompt(
    product_name: str,
    idea_text: str,
    target_audience: str | None = None,
    budget_range: str | None = None,
    timeline_pressure: str | None = None,
) -> str:
    """Build the user prompt for scope generation."""
    parts = [
        f"Product: {product_name}.",
        f"Idea: {idea_text}.",
    ]
    if target_audience:
        parts.append(f"Audience: {target_audience}.")
    if budget_range:
        parts.append(f"Budget: {budget_range}.")
    if timeline_pressure:
        parts.append(f"Timeline: {timeline_pressure.replace('_', ' ')}.")
    return "\n".join(parts)


SCOPE_SYSTEM_PROMPT = (
    "You are an experienced product manager and software architect at a product "
    "development studio. Your job is to take a startup idea and break it into a "
    "structured engineering scope.\n\n"
    "Generate a comprehensive scope with:\n"
    "- 4 to 8 epics, each with 3 to 6 user stories\n"
    "- Realistic effort estimates in working days\n"
    "- A suggested tech stack appropriate for the idea\n"
    "- A total timeline estimate in weeks\n"
    "- 3 to 5 identified risks with severity ratings\n\n"
    "Make user stories follow the format: "
    '"As a [user], I want [action] so that [outcome]".'
)


def build_summary_prompt(
    project_name: str,
    description: str,
    week_start: str,
    milestone_statuses: str,
    updates_formatted: str,
    tone: str = "executive",
) -> tuple[str, str]:
    """Build the system and user prompts for weekly summary generation.

    Returns (system_prompt, user_prompt).
    """
    if tone == "technical":
        system = (
            "You are a senior engineering lead writing an internal weekly status "
            "report for the development team. Write in professional prose, 3-4 "
            "paragraphs. Be specific — use actual milestone names and update "
            "content. Cover: overall progress, key technical accomplishments this "
            "week, current blockers (if any), and recommended next steps. "
            "Never use bullet points — write in full paragraphs only."
        )
    else:
        system = (
            "You are a senior project manager writing a weekly status report for "
            "a client. Write in professional prose, 3-4 paragraphs. Be specific — "
            "use actual milestone names and update content. Cover: overall "
            "progress, key accomplishments this week, current blockers (if any), "
            "and recommended next steps. Never use bullet points in your response "
            "— write in full paragraphs only."
        )

    user = (
        f"Project: {project_name}.\n"
        f"Description: {description}.\n"
        f"Week of: {week_start}.\n\n"
        f"Milestone statuses:\n{milestone_statuses}\n\n"
        f"Updates this week:\n{updates_formatted}"
    )

    return system, user
