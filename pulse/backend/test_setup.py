#!/usr/bin/env python3
"""
Quick setup test for Pulse Analytics Backend.
Verifies that all dependencies are installed and the database is ready.
"""

import sys
from pathlib import Path


def test_imports():
    """Test that all required modules can be imported."""
    print("Checking Python dependencies...")

    required_modules = [
        ("fastapi", "FastAPI"),
        ("uvicorn", "Uvicorn"),
        ("pydantic", "Pydantic"),
        ("dotenv", "python-dotenv"),
        ("anthropic", "Anthropic"),
    ]

    missing = []
    for module, name in required_modules:
        try:
            __import__(module)
            print(f"  ✓ {name}")
        except ImportError:
            print(f"  ✗ {name} - MISSING")
            missing.append(name)

    return len(missing) == 0, missing


def test_local_modules():
    """Test that local modules can be imported."""
    print("\nChecking local modules...")

    try:
        import database
        print("  ✓ database.py")
    except Exception as e:
        print(f"  ✗ database.py - {e}")
        return False

    try:
        import models
        print("  ✓ models.py")
    except Exception as e:
        print(f"  ✗ models.py - {e}")
        return False

    try:
        from services import query_engine, anomaly_detector, digest_generator
        print("  ✓ services/")
    except Exception as e:
        print(f"  ✗ services/ - {e}")
        return False

    try:
        from routes import query, metrics, anomalies, digest
        print("  ✓ routes/")
    except Exception as e:
        print(f"  ✗ routes/ - {e}")
        return False

    return True


def main():
    print("=" * 60)
    print("Pulse Analytics Backend - Setup Test")
    print("=" * 60)

    # Test imports
    deps_ok, missing = test_imports()

    if not deps_ok:
        print(f"\n✗ Missing dependencies: {', '.join(missing)}")
        print("\nInstall with:")
        print("  pip install -r requirements.txt")
        return 1

    # Test local modules
    if not test_local_modules():
        print("\n✗ Error loading local modules")
        return 1

    print("\n" + "=" * 60)
    print("All checks passed!")
    print("=" * 60)
    print("\nYou're ready to start the server:")
    print("  python main.py")
    print("\nOr with uvicorn directly:")
    print("  uvicorn main:app --reload")
    print("\nAPI will be available at: http://localhost:8000")
    print("Swagger UI: http://localhost:8000/docs")
    print("=" * 60)

    return 0


if __name__ == "__main__":
    sys.exit(main())
