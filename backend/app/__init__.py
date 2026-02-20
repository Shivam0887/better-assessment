from flask import Flask, jsonify
from flask_cors import CORS


def create_app(config_name: str = "development") -> Flask:
    """Flask application factory."""
    app = Flask(__name__)

    # Load config
    from config import config as config_map
    app.config.from_object(config_map.get(config_name, config_map["development"]))

    # Enable CORS for frontend dev server
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register blueprints
    from app.routes import register_blueprints
    register_blueprints(app)

    # ── Global error handlers ──
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": str(e.description), "code": 400}), 400

    # Handle Supabase/PostgREST errors globally
    try:
        from postgrest.exceptions import APIError as PostgrestAPIError

        @app.errorhandler(PostgrestAPIError)
        def handle_postgrest_error(e):
            msg = getattr(e, "message", str(e))
            return jsonify({"error": f"Database error: {msg}", "code": 500}), 500
    except ImportError:
        pass

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "code": 404}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error", "code": 500}), 500

    return app
