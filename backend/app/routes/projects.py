"""Projects endpoints — /api/v1/projects/*"""

from datetime import date, timedelta

from flask import Blueprint, request, jsonify, abort
from app.db import supabase
from app.services.summary_service import generate_summary
from app.utils.validators import (
    validate_required,
    validate_enum,
    VALID_PROJECT_STATUSES,
    VALID_SUMMARY_TONES,
)

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("/projects", methods=["GET"])
def get_projects():
    """List all active projects with progress summary."""
    projects = (
        supabase.table("projects")
        .select("*, milestones(id, status, progress_percent, due_date, assigned_to), team_members(id, name, avatar_color)")
        .order("created_at", desc=True)
        .execute()
    ).data

    cards = []
    for p in projects:
        ms = p.pop("milestones", []) or []
        team = p.pop("team_members", []) or []
        total = len(ms)
        completed = sum(1 for m in ms if m["status"] == "completed")
        progress = (
            round(sum(m["progress_percent"] for m in ms) / total) if total else 0
        )
        blocker_count = sum(1 for m in ms if m["status"] == "blocked")
        overdue_count = sum(
            1 for m in ms
            if m["due_date"] and m["status"] != "completed"
            and date.fromisoformat(m["due_date"]) < date.today()
        )

        # Health: green / amber / red
        if blocker_count >= 2 or overdue_count > 0:
            health = "red"
        elif blocker_count == 1:
            health = "amber"
        else:
            health = "green"

        # Next due date
        upcoming = sorted(
            [m for m in ms if m["status"] != "completed" and m["due_date"]],
            key=lambda m: m["due_date"],
        )
        next_due = upcoming[0]["due_date"] if upcoming else None

        cards.append({
            **p,
            "milestone_count": total,
            "completed_milestones": completed,
            "progress_percent": progress,
            "health": health,
            "next_due_date": next_due,
            "team_members": team,
        })

    return jsonify({"projects": cards})


@projects_bp.route("/projects/<project_id>", methods=["GET"])
def get_project(project_id: str):
    """Full project detail: milestones, team, recent updates."""
    project = (
        supabase.table("projects")
        .select("*")
        .eq("id", project_id)
        .single()
        .execute()
    ).data

    if not project:
        abort(404, description="Project not found")

    return jsonify({"project": project})


@projects_bp.route("/projects/<project_id>", methods=["PATCH"])
def patch_project(project_id: str):
    """Update name, description, status, start_date."""
    data = request.get_json(silent=True) or {}

    if "status" in data:
        err = validate_enum(data["status"], VALID_PROJECT_STATUSES, "status")
        if err:
            abort(400, description=err)

    allowed = {"name", "description", "status", "start_date"}
    filtered = {k: v for k, v in data.items() if k in allowed}

    result = (
        supabase.table("projects").update(filtered).eq("id", project_id).execute()
    )
    if not result.data:
        abort(404, description="Project not found")
    return jsonify({"project": result.data[0]})


@projects_bp.route("/projects/<project_id>/milestones", methods=["GET"])
def get_milestones(project_id: str):
    """All milestones for a project, ordered by order_index."""
    milestones = (
        supabase.table("milestones")
        .select("*, user_stories(*)")
        .eq("project_id", project_id)
        .order("order_index")
        .execute()
    ).data

    return jsonify({"milestones": milestones})


@projects_bp.route("/projects/<project_id>/milestones/reorder", methods=["PATCH"])
def reorder_milestones(project_id: str):
    """Accept array of {id, order_index} pairs to persist drag-drop order."""
    data = request.get_json(silent=True) or {}
    order = data.get("order", [])

    if not order:
        abort(400, description="'order' array is required")

    for item in order:
        supabase.table("milestones").update(
            {"order_index": item["order_index"]}
        ).eq("id", item["id"]).eq("project_id", project_id).execute()

    return jsonify({"success": True})


@projects_bp.route("/projects/<project_id>/updates", methods=["GET"])
def get_project_updates(project_id: str):
    """Paginated activity feed — all updates across all milestones."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    offset = (page - 1) * per_page

    # First get milestone IDs for this project
    milestones = (
        supabase.table("milestones")
        .select("id, name")
        .eq("project_id", project_id)
        .execute()
    ).data

    milestone_ids = [m["id"] for m in milestones]
    milestone_names = {m["id"]: m["name"] for m in milestones}

    if not milestone_ids:
        return jsonify({"updates": [], "page": page, "per_page": per_page})

    updates = (
        supabase.table("updates")
        .select("*")
        .in_("milestone_id", milestone_ids)
        .order("logged_at", desc=True)
        .range(offset, offset + per_page - 1)
        .execute()
    ).data

    # Attach milestone names
    for u in updates:
        u["milestone_name"] = milestone_names.get(u["milestone_id"], "")

    return jsonify({"updates": updates, "page": page, "per_page": per_page})


@projects_bp.route("/projects/<project_id>/summary", methods=["POST"])
def create_summary(project_id: str):
    """Generate AI weekly summary."""
    data = request.get_json(silent=True) or {}
    tone = data.get("tone", "executive")

    err = validate_enum(tone, VALID_SUMMARY_TONES, "tone")
    if err:
        abort(400, description=err)

    try:
        summary = generate_summary(project_id, tone)
        return jsonify({"summary": summary}), 201
    except RuntimeError as e:
        return jsonify({"error": str(e), "code": 500}), 500


@projects_bp.route("/projects/<project_id>/summaries", methods=["GET"])
def get_summaries(project_id: str):
    """All past summaries for a project."""
    summaries = (
        supabase.table("summaries")
        .select("*")
        .eq("project_id", project_id)
        .order("generated_at", desc=True)
        .execute()
    ).data

    return jsonify({"summaries": summaries})


@projects_bp.route("/projects/<project_id>/notifications", methods=["GET"])
def get_notifications(project_id: str):
    """Compute milestone overdue/due-soon alerts."""
    milestones = (
        supabase.table("milestones")
        .select("id, name, status, due_date, assigned_to")
        .eq("project_id", project_id)
        .neq("status", "completed")
        .execute()
    ).data

    today = date.today()
    soon_threshold = today + timedelta(hours=48)
    notifications = []

    for m in milestones:
        if not m.get("due_date"):
            continue
        due = date.fromisoformat(m["due_date"])

        if due < today:
            notifications.append({
                "type": "overdue",
                "milestone_id": m["id"],
                "milestone_name": m["name"],
                "due_date": m["due_date"],
                "message": f"'{m['name']}' is past due ({m['due_date']})",
            })
        elif due <= soon_threshold:
            notifications.append({
                "type": "due_soon",
                "milestone_id": m["id"],
                "milestone_name": m["name"],
                "due_date": m["due_date"],
                "message": f"'{m['name']}' is due soon ({m['due_date']})",
            })

    # Also check for active blockers
    blockers = (
        supabase.table("milestones")
        .select("id, name")
        .eq("project_id", project_id)
        .eq("status", "blocked")
        .execute()
    ).data

    for b in blockers:
        notifications.append({
            "type": "blocker",
            "milestone_id": b["id"],
            "milestone_name": b["name"],
            "message": f"'{b['name']}' is blocked",
        })

    return jsonify({"notifications": notifications})


@projects_bp.route("/projects/<project_id>/team", methods=["GET"])
def get_team(project_id: str):
    """List all team members for a project."""
    members = (
        supabase.table("team_members")
        .select("*")
        .eq("project_id", project_id)
        .order("created_at")
        .execute()
    ).data

    return jsonify({"team_members": members})


@projects_bp.route("/projects/<project_id>/team", methods=["POST"])
def add_team_member(project_id: str):
    """Add a new team member."""
    data = request.get_json(silent=True) or {}

    error = validate_required(data, ["name", "role"])
    if error:
        abort(400, description=error)

    member_data = {
        "project_id": project_id,
        "name": data["name"],
        "role": data["role"],
        "avatar_color": data.get("avatar_color", "#2563EB"),
    }

    result = supabase.table("team_members").insert(member_data).execute()
    return jsonify({"team_member": result.data[0]}), 201
@projects_bp.route("/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id: str):
    """Hard delete project and all related data (handled by FK cascades)."""
    result = supabase.table("projects").delete().eq("id", project_id).execute()
    if not result.data:
        abort(404, description="Project not found")
    return jsonify({"success": True})


@projects_bp.route("/projects/<project_id>/milestones", methods=["POST"])
def create_milestone(project_id: str):
    """Create a new manual milestone for a project."""
    data = request.get_json(silent=True) or {}
    error = validate_required(data, ["name", "due_date"])
    if error:
        abort(400, description=error)

    # Get max order_index
    max_idx = 0
    existing = supabase.table("milestones").select("order_index").eq("project_id", project_id).execute().data
    if existing:
        max_idx = max(m.get("order_index", 0) for m in existing) + 1

    ms_data = {
        "project_id": project_id,
        "name": data["name"],
        "description": data.get("description", ""),
        "due_date": data["due_date"],
        "status": "not_started",
        "progress_percent": 0,
        "order_index": max_idx
    }
    result = supabase.table("milestones").insert(ms_data).execute()
    return jsonify({"milestone": result.data[0]}), 201
