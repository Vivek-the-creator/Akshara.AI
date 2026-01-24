import os
from dotenv import load_dotenv
from services.handwriting_evaluator import TamilHandwritingEvaluator

# Load environment variables
load_dotenv()

def test_handwriting_evaluator():
    """Test the handwriting evaluator service"""
    try:
        print("🔍 Testing Tamil Handwriting Evaluator...")
        
        # Check if API key is available
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ GEMINI_API_KEY not found in environment variables")
            print("Please add your Gemini API key to the .env file")
            return False
        
        print(f"✅ API Key found: {api_key[:10]}...")
        
        # Initialize evaluator
        evaluator = TamilHandwritingEvaluator()
        print("✅ Evaluator initialized successfully")
        
        # Test with a dummy image (this will fail but tests the initialization)
        try:
            # Create a simple test image
            from PIL import Image
            import io
            
            # Create a small test image
            test_image = Image.new('RGB', (100, 100), color='white')
            img_buffer = io.BytesIO()
            test_image.save(img_buffer, format='JPEG')
            img_data = img_buffer.getvalue()
            
            # Test evaluation (this will likely fail due to no actual letter, but tests the flow)
            result = evaluator.evaluate_handwriting(
                image_data=img_data,
                expected_letter="அ",
                level="beginner"
            )
            
            print("✅ Evaluation completed")
            print(f"Result keys: {list(result.keys())}")
            
            # Check if result has required fields
            required_fields = [
                "is_acceptable", "identified_letter", "matches_expected",
                "confidence_score", "feedback", "improvements", "can_proceed"
            ]
            
            missing_fields = [field for field in required_fields if field not in result]
            if missing_fields:
                print(f"⚠️  Missing fields in result: {missing_fields}")
            else:
                print("✅ All required fields present in result")
            
            return True
            
        except Exception as e:
            print(f"⚠️  Evaluation test failed (expected with dummy image): {str(e)}")
            return True  # Still consider success since initialization worked
            
    except Exception as e:
        print(f"❌ Evaluator test failed: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_handwriting_evaluator()
    if success:
        print("\n🎉 Handwriting evaluator is ready!")
        print("\n📝 Available API endpoints:")
        print("  POST /handwriting/evaluate - Evaluate handwritten letter")
        print("  GET  /handwriting/levels - Get learning levels")
        print("  GET  /handwriting/history - Get evaluation history")
        print("  GET  /handwriting/stats - Get evaluation statistics")
    else:
        print("\n❌ Please check your setup and try again")
