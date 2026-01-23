try:
    import google.generativeai as genai
    print("✅ google-generativeai imported successfully")
except ImportError as e:
    print(f"❌ Failed to import google-generativeai: {e}")

try:
    from PIL import Image
    print("✅ PIL imported successfully")
except ImportError as e:
    print(f"❌ Failed to import PIL: {e}")

try:
    from routes import auth, user, writing, progress
    print("✅ All routes imported successfully")
except ImportError as e:
    print(f"❌ Failed to import routes: {e}")

try:
    from services.aiEvaluator import ai_evaluator
    print("✅ ai_evaluator imported successfully")
except ImportError as e:
    print(f"❌ Failed to import ai_evaluator: {e}")

print("All imports tested!")
