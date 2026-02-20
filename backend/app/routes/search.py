"""Global search endpoint — /api/v1/search"""

from flask import Blueprint, request, jsonify

from app.db import supabase

search_bp = Blueprint("search", __name__)


@search_bp.route("/search", methods=["GET"])
def global_search():
    """Search across projects, milestones, and updates.

    Returns results grouped by type.
    """
    q = request.args.get("q", "").strip()
    if not q or len(q) < 2:
        return jsonify({"results": []})

    pattern = f"%{q}%"

    # Search projects by name
    projects = (
        supabase.table("projects")
        .select("id, name, status")
        .ilike("name", pattern)
        .limit(5)
        .execute()
    ).data

    # Search milestones by name
    milestones = (
        supabase.table("milestones")
        .select("id, name, project_id, status")
        .ilike("name", pattern)
        .limit(5)
        .execute()
    ).data

    # Search updates by content
    updates = (
        supabase.table("updates")
        .select("id, content, update_type, milestone_id")
        .ilike("content", pattern)
        .limit(5)
        .execute()
    ).data

    results = []

    for p in projects:
        results.append({
            "type": "project",
            "id": p["id"],
            "title": p["name"],
            "subtitle": f"Status: {p['status'].replace('_', ' ').capitalize()}",
        })

    for m in milestones:
        results.append({
            "type": "milestone",
            "id": m["id"],
            "project_id": m["project_id"],
            "title": m["name"],
            "subtitle": f"Status: {m['status'].replace('_', ' ').capitalize()}",
        })

    for u in updates:
        results.append({
            "type": "update",
            "id": u["id"],
            "milestone_id": u["milestone_id"],
            "title": u["content"][:60] + ("..." if len(u["content"]) > 60 else ""),
            "subtitle": f"Update type: {u['update_type'].capitalize()}",
        })

    return jsonify({"results": results})
