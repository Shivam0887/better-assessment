"""Milestones, user stories, team members, and updates endpoints."""

from flask import Blueprint, request, jsonify, abort
from app.db import supabase
from app.utils.validators import (
    validate_required,
    validate_enum,
    VALID_MILESTONE_STATUSES,
    VALID_UPDATE_TYPES,
    VALID_PROGRESS_VALUES,
)

milestones_bp = Blueprint("milestones", __name__)


# ── Milestones ──

@milestones_bp.route("/milestones/<milestone_id>", methods=["GET"])
def get_milestone(milestone_id: str):
    """Single milestone with its user stories and updates."""
    milestone = (
        supabase.table("milestones")
        .select("*, user_stories(*), updates(*)")
        .eq("id", milestone_id)
        .single()
        .execute()
    ).data

    if not milestone:
        abort(404, description="Milestone not found")

    # Sort updates by logged_at descending
    if milestone.get("updates"):
        milestone["updates"] = sorted(
            milestone["updates"], key=lambda u: u.get("logged_at", ""), reverse=True
        )

    return jsonify({"milestone": milestone})


@milestones_bp.route("/milestones/<milestone_id>", methods=["PATCH"])
def patch_milestone(milestone_id: str):
    """Update status, progress_percent, due_date, assigned_to, name."""
    data = request.get_json(silent=True) or {}

    if "status" in data:
        err = validate_enum(data["status"], VALID_MILESTONE_STATUSES, "status")
        if err:
            abort(400, description=err)

    if "progress_percent" in data:
        if data["progress_percent"] not in VALID_PROGRESS_VALUES:
            abort(400, description=f"'progress_percent' must be one of: {sorted(VALID_PROGRESS_VALUES)}")

    allowed = {"status", "progress_percent", "due_date", "assigned_to", "name", "description"}
    filtered = {k: v for k, v in data.items() if k in allowed}

    result = (
        supabase.table("milestones").update(filtered).eq("id", milestone_id).execute()
    )
    if not result.data:
        abort(404, description="Milestone not found")
    return jsonify({"milestone": result.data[0]})


@milestones_bp.route("/milestones/<milestone_id>", methods=["DELETE"])
def delete_milestone(milestone_id: str):
    """Hard delete milestone and its updates/stories (handled by FK cascades)."""
    result = (
        supabase.table("milestones").delete().eq("id", milestone_id).execute()
    )
    if not result.data:
        abort(404, description="Milestone not found")
    return jsonify({"success": True})


# ── Updates ──

@milestones_bp.route("/milestones/<milestone_id>/updates", methods=["POST"])
def log_update(milestone_id: str):
    """Log a new update for a milestone."""
    data = request.get_json(silent=True) or {}

    error = validate_required(data, ["update_type", "content"])
    if error:
        abort(400, description=error)

    err = validate_enum(data["update_type"], VALID_UPDATE_TYPES, "update_type")
    if err:
        abort(400, description=err)

    update_data = {
        "milestone_id": milestone_id,
        "update_type": data["update_type"],
        "content": data["content"],
    }
    if "logged_at" in data:
        update_data["logged_at"] = data["logged_at"]

    result = supabase.table("updates").insert(update_data).execute()
    update = result.data[0]

    # Attach milestone name for frontend convenience
    milestone = (
        supabase.table("milestones")
        .select("name")
        .eq("id", milestone_id)
        .single()
        .execute()
    ).data
    update["milestone_name"] = milestone["name"] if milestone else ""

    return jsonify({"update": update}), 201


# ── User Stories ──

@milestones_bp.route("/user-stories/<story_id>", methods=["PATCH"])
def patch_user_story(story_id: str):
    """Toggle is_completed or update title/description."""
    data = request.get_json(silent=True) or {}

    allowed = {"is_completed", "title", "description"}
    filtered = {k: v for k, v in data.items() if k in allowed}

    if not filtered:
        abort(400, description="No valid fields to update")

    result = (
        supabase.table("user_stories").update(filtered).eq("id", story_id).execute()
    )
    if not result.data:
        abort(404, description="User story not found")
    return jsonify({"user_story": result.data[0]})


@milestones_bp.route("/milestones/<milestone_id>/user-stories", methods=["POST"])
def create_user_story(milestone_id: str):
    """Create a new manual user story for a milestone."""
    data = request.get_json(silent=True) or {}
    error = validate_required(data, ["title"])
    if error:
        abort(400, description=error)

    # Get max order_index
    max_idx = 0
    existing = supabase.table("user_stories").select("order_index").eq("milestone_id", milestone_id).execute().data
    if existing:
        max_idx = max((s.get("order_index", 0) or 0) for s in existing) + 1

    story_data = {
        "milestone_id": milestone_id,
        "title": data["title"],
        "description": data.get("description", ""),
        "is_completed": False,
        "order_index": max_idx
    }
    result = supabase.table("user_stories").insert(story_data).execute()
    return jsonify({"user_story": result.data[0]}), 201


@milestones_bp.route("/user-stories/<story_id>", methods=["DELETE"])
def delete_user_story(story_id: str):
    """Hard delete a user story."""
    result = supabase.table("user_stories").delete().eq("id", story_id).execute()
    if not result.data:
        abort(404, description="User story not found")
    return jsonify({"success": True})


# ── Team Members ──

@milestones_bp.route("/team-members/<member_id>", methods=["PATCH"])
def patch_team_member(member_id: str):
    """Update name, role, or avatar_color."""
    data = request.get_json(silent=True) or {}

    allowed = {"name", "role", "avatar_color"}
    filtered = {k: v for k, v in data.items() if k in allowed}

    if not filtered:
        abort(400, description="No valid fields to update")

    result = (
        supabase.table("team_members").update(filtered).eq("id", member_id).execute()
    )
    if not result.data:
        abort(404, description="Team member not found")
    return jsonify({"team_member": result.data[0]})


@milestones_bp.route("/team-members/<member_id>", methods=["DELETE"])
def delete_team_member(member_id: str):
    """Remove team member — assigned_to on milestones SET NULL handled by DB."""
    result = (
        supabase.table("team_members").delete().eq("id", member_id).execute()
    )
    if not result.data:
        abort(404, description="Team member not found")
    return jsonify({"success": True})
