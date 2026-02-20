import sys
import os

# Add backend to Python path so Flask app can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# DIAGNOSTIC: Print sys.path to verify backend is included
print(f"DEBUG: sys.path: {sys.path}")

try:
    # DIAGNOSTIC: Attempt to import Google GenAI SDK explicitly to check availability
    try:
        import google.genai
        print("DEBUG: Successfully imported google.genai")
    except ImportError as e:
        print(f"DEBUG: Failed to import google.genai: {e}")
        # List installed packages to help debug missing dependencies
        try:
            import pkg_resources
            print("DEBUG: Installed packages:")
            for dist in pkg_resources.working_set:
                print(f" - {dist.project_name} ({dist.version})")
        except ImportError:
            print("DEBUG: pkg_resources not available to list packages")

    from app import create_app
    app = create_app()
except Exception as e:
    import traceback
    # Print clear, non-truncated error message for Vercel logs
    print(f"CRITICAL ERROR: {type(e).__name__}: {str(e)}")
    print("Traceback:")
    print(traceback.format_exc())
    raise e
