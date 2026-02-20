"""Scopes endpoints — /api/v1/scopes/*"""

from flask import Blueprint, request, jsonify, abort
from app.services.scope_service import (
    create_scope,
    get_scope,
    list_scopes,
    update_scope,
    archive_scope,
    convert_scope_to_project,
)
from app.utils.validators import validate_required, validate_enum, VALID_SCOPE_STATUSES

scopes_bp = Blueprint("scopes", __name__)


@scopes_bp.route("/scopes", methods=["GET"])
def get_scopes():
    """List all scopes — returns id, product_name, status, created_at."""
    scopes = list_scopes()
    return jsonify({"scopes": scopes})


@scopes_bp.route("/scopes/generate", methods=["POST"])
def generate_scope():
    """Receive idea text + context, call LLM, persist full scope."""
    data = request.get_json(silent=True) or {}

    error = validate_required(data, ["product_name", "idea_text"])
    if error:
        abort(400, description=error)

    # Validate optional enums
    for field, valid_set in [
        ("budget_range", {"low", "medium", "high"}),
        ("timeline_pressure", {"asap", "1_3_months", "3_6_months", "flexible"}),
    ]:
        err = validate_enum(data.get(field), valid_set, field)
        if err:
            abort(400, description=err)

    try:
        scope = create_scope(
            product_name=data["product_name"],
            idea_text=data["idea_text"],
            target_audience=data.get("target_audience"),
            budget_range=data.get("budget_range"),
            timeline_pressure=data.get("timeline_pressure"),
        )
        return jsonify({"scope": scope}), 201
    except RuntimeError as e:
        return jsonify({"error": str(e), "code": 500}), 500


@scopes_bp.route("/scopes/<scope_id>", methods=["GET"])
def get_scope_by_id(scope_id: str):
    """Return full scope including epics and user stories."""
    scope = get_scope(scope_id)
    if not scope:
        abort(404, description="Scope not found")
    return jsonify({"scope": scope})


@scopes_bp.route("/scopes/<scope_id>", methods=["PATCH"])
def patch_scope(scope_id: str):
    """Update product name, idea text, or status."""
    data = request.get_json(silent=True) or {}

    if "status" in data:
        err = validate_enum(data["status"], VALID_SCOPE_STATUSES, "status")
        if err:
            abort(400, description=err)

    updated = update_scope(scope_id, data)
    if not updated:
        abort(404, description="Scope not found")
    return jsonify({"scope": updated})


@scopes_bp.route("/scopes/<scope_id>/convert", methods=["POST"])
def convert_scope(scope_id: str):
    """Convert scope to project — creates project + milestones + user stories."""
    data = request.get_json(silent=True) or {}

    try:
        project = convert_scope_to_project(
            scope_id, start_date_str=data.get("start_date")
        )
        return jsonify({"project": project}), 201
    except ValueError as e:
        abort(400, description=str(e))


@scopes_bp.route("/scopes/<scope_id>", methods=["DELETE"])
def delete_scope(scope_id: str):
    """Soft delete — set status to archived."""
    result = archive_scope(scope_id)
    if not result:
        abort(404, description="Scope not found")
    return jsonify({"scope": result})
