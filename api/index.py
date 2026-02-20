import sys
import os

# Add backend to Python path so Flask app can be imported
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import create_app

app = create_app()
