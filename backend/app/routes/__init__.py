"""Blueprint registration — imports all route modules and registers them."""

from flask import Flask


def register_blueprints(app: Flask) -> None:
    """Register all API blueprints with the /api/v1 prefix."""
    from app.routes.scopes import scopes_bp
    from app.routes.projects import projects_bp
    from app.routes.milestones import milestones_bp
    from app.routes.search import search_bp

    app.register_blueprint(scopes_bp, url_prefix="/api/v1")
    app.register_blueprint(projects_bp, url_prefix="/api/v1")
    app.register_blueprint(milestones_bp, url_prefix="/api/v1")
    app.register_blueprint(search_bp, url_prefix="/api/v1")
