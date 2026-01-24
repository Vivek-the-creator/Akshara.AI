import requests
import io
from PIL import Image

def test_handwriting_api():
    """Test the handwriting evaluation API endpoint"""
    
    # Create a simple test image
    test_image = Image.new('RGB', (200, 200), color='white')
    img_buffer = io.BytesIO()
    test_image.save(img_buffer, format='JPEG')
    img_data = img_buffer.getvalue()
    
    # Test the endpoint (without authentication for now)
    url = "http://localhost:8000/handwriting/levels"
    
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            print("✅ Handwriting API is working!")
        else:
            print("❌ Handwriting API test failed")
            
    except Exception as e:
        print(f"❌ Error testing API: {str(e)}")

if __name__ == "__main__":
    test_handwriting_api()
