from services.handwriting_evaluator import evaluator
from PIL import Image, ImageDraw, ImageFont
import io

def create_test_image_with_letter(letter_text="அ"):
    """Create a test image with Tamil letter"""
    img = Image.new('RGB', (200, 200), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to draw a simple representation
    try:
        # Draw a simple circle/oval to simulate a letter
        draw.ellipse([50, 50, 150, 150], outline='black', width=3)
        # Add some lines to make it look like a letter
        draw.line([100, 50, 100, 150], fill='black', width=2)
        draw.line([50, 100, 150, 100], fill='black', width=2)
    except:
        pass
    
    buf = io.BytesIO()
    img.save(buf, format='JPEG')
    return buf.getvalue()

def test_evaluation_logic():
    """Test the evaluation logic with different scenarios"""
    print("🧪 Testing Handwriting Evaluation Logic")
    print("=" * 50)
    
    # Test 1: Blank image (should be rejected)
    print("\n1️⃣ Testing with blank image:")
    blank_img = Image.new('RGB', (100, 100), color='white')
    buf = io.BytesIO()
    blank_img.save(buf, format='JPEG')
    
    result1 = evaluator.evaluate_handwriting(buf.getvalue(), 'அ', 'beginner')
    is_correct1 = (result1['is_acceptable'] == True and 
                  result1['can_proceed'] == True and 
                  result1['matches_expected'] == True)
    
    print(f"   Is Acceptable: {result1['is_acceptable']}")
    print(f"   Can Proceed: {result1['can_proceed']}")
    print(f"   Matches Expected: {result1['matches_expected']}")
    print(f"   Should show success modal: {is_correct1}")
    print(f"   Feedback: {result1['feedback'][:60]}...")
    
    # Test 2: Image with letter-like drawing
    print("\n2️⃣ Testing with letter-like drawing:")
    letter_img_data = create_test_image_with_letter('அ')
    result2 = evaluator.evaluate_handwriting(letter_img_data, 'அ', 'beginner')
    is_correct2 = (result2['is_acceptable'] == True and 
                  result2['can_proceed'] == True and 
                  result2['matches_expected'] == True)
    
    print(f"   Is Acceptable: {result2['is_acceptable']}")
    print(f"   Can Proceed: {result2['can_proceed']}")
    print(f"   Matches Expected: {result2['matches_expected']}")
    print(f"   Should show success modal: {is_correct2}")
    print(f"   Feedback: {result2['feedback'][:60]}...")
    
    # Test 3: Multiple tests to see different responses
    print("\n3️⃣ Testing multiple attempts (to see variance):")
    for i in range(3):
        result = evaluator.evaluate_handwriting(letter_img_data, 'அ', 'beginner')
        is_correct = (result['is_acceptable'] == True and 
                     result['can_proceed'] == True and 
                     result['matches_expected'] == True)
        print(f"   Attempt {i+1}: Correct={is_correct}, Acceptable={result['is_acceptable']}")
    
    print("\n✅ Evaluation Logic Test Complete!")
    print("📝 Summary:")
    print(f"   - Blank image correctly rejected: {not is_correct1}")
    print(f"   - Letter image evaluated: {'Accepted' if is_correct2 else 'Rejected'}")
    print(f"   - Frontend logic will show modal only when ALL three flags are True")

if __name__ == "__main__":
    test_evaluation_logic()
