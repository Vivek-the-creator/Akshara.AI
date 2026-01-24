import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def check_available_models():
    """Check what Gemini models are available"""
    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ GEMINI_API_KEY not found")
            return
        
        genai.configure(api_key=api_key)
        
        # List available models
        models = genai.list_models()
        
        print("🔍 Available Gemini Models:")
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                print(f"✅ {model.name} - {model.display_name}")
            else:
                print(f"❌ {model.name} - {model.display_name} (no generateContent)")
                
    except Exception as e:
        print(f"❌ Error checking models: {str(e)}")

if __name__ == "__main__":
    check_available_models()
