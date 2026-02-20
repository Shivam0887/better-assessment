"""Input validation helpers for API request data."""

from typing import Any

VALID_BUDGET_RANGES = {"low", "medium", "high"}
VALID_TIMELINE_PRESSURES = {"asap", "1_3_months", "3_6_months", "flexible"}
VALID_SCOPE_STATUSES = {"draft", "converted", "archived"}
VALID_PROJECT_STATUSES = {"active", "on_hold", "completed", "archived"}
VALID_MILESTONE_STATUSES = {"not_started", "in_progress", "completed", "blocked"}
VALID_UPDATE_TYPES = {"progress", "blocker", "completed", "note"}
VALID_SUMMARY_TONES = {"technical", "executive"}
VALID_PROGRESS_VALUES = {0, 25, 50, 75, 100}


def validate_required(data: dict[str, Any], fields: list[str]) -> str | None:
    """Return an error message if any required field is missing or empty."""
    for field in fields:
        if field not in data or data[field] is None or str(data[field]).strip() == "":
            return f"'{field}' is required"
    return None


def validate_enum(value: Any, valid_values: set[str], field_name: str) -> str | None:
    """Return an error message if value is not in the allowed set."""
    if value is not None and value not in valid_values:
        return f"'{field_name}' must be one of: {', '.join(sorted(valid_values))}"
    return None
