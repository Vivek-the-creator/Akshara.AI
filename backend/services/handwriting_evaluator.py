import os
import base64
import json
from typing import Dict, Any, Optional
from PIL import Image
import io
import google.generativeai as genai
from dotenv import load_dotenv
from .mock_handwriting_evaluator import mock_evaluator

load_dotenv()

class TamilHandwritingEvaluator:
    """AI-powered Tamil handwriting evaluation service"""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Tamil letter levels mapping (you can expand this)
        self.tamil_levels = {
            "beginner": ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"],
            "intermediate": ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"],
            "advanced": ["க்", "ங்", "ச்", "ஞ்", "ட்", "ண்", "த்", "ந்", "ப்", "ம்", "ய்", "ர்", "ல்", "வ்", "ழ்", "ள்", "ற்", "ன்"]
        }
    
    def _prepare_image(self, image_data: bytes) -> Image.Image:
        """Prepare and optimize image for evaluation"""
        try:
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to optimal size for AI processing
            max_size = 1024
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            return image
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")
    
    def _create_evaluation_prompt(self, expected_letter: str, level: str) -> str:
        """Create the evaluation prompt for Gemini AI"""
        
        level_letters = self.tamil_levels.get(level, self.tamil_levels["beginner"])
        
        prompt = f"""
You are an expert Tamil handwriting evaluator for children's education.

TASK: Evaluate a handwritten Tamil letter and provide educational assessment.

EXPECTED LETTER: {expected_letter}
CURRENT LEVEL: {level}
ACCEPTABLE LETTERS FOR THIS LEVEL: {', '.join(level_letters)}

EVALUATION CRITERIA:
1. Identify if the handwritten letter matches the expected letter: {expected_letter}
2. Assess if the structure is ACCEPTABLE for a child's learning level
3. Be lenient with minor variations in:
   - Curve shapes and proportions
   - Line thickness
   - Slight tilt or angle
   - Minor stroke order differences
4. REJECT if:
   - Letter clearly matches a DIFFERENT Tamil character
   - Image is blank or contains scribbles
   - Multiple letters are present
   - Completely unrecognizable

RESPONSE FORMAT (STRICT JSON ONLY):
{{
    "is_acceptable": true/false,
    "identified_letter": "actual_letter_identified",
    "matches_expected": true/false,
    "confidence_score": 0.0-1.0,
    "feedback": "encouraging_message_for_child",
    "improvements": ["specific_improvement_1", "specific_improvement_2"],
    "can_proceed": true/false,
    "level_appropriate": true/false
}}

IMPORTANT:
- Return ONLY the JSON object, no markdown or extra text
- Feedback should be encouraging and child-friendly
- Improvements should be specific and actionable
- Consider the child's learning level in assessment
"""

        return prompt
    
    def evaluate_handwriting(self, image_data: bytes, expected_letter: str, level: str = "beginner") -> Dict[str, Any]:
        """
        Evaluate handwritten Tamil letter
        
        Args:
            image_data: Raw image bytes
            expected_letter: The Tamil letter the child should have written
            level: Current learning level (beginner, intermediate, advanced)
        
        Returns:
            Dict containing evaluation results
        """
        try:
            # Prepare image
            image = self._prepare_image(image_data)
            
            # Create evaluation prompt
            prompt = self._create_evaluation_prompt(expected_letter, level)
            
            # Generate evaluation
            response = self.model.generate_content([prompt, image])
            
            # Parse response
            result_text = response.text.strip()
            
            # Clean up the response to ensure it's valid JSON
            if result_text.startswith("```json"):
                result_text = result_text.replace("```json", "").replace("```", "").strip()
            
            evaluation_result = json.loads(result_text)
            
            # Add metadata
            evaluation_result["expected_letter"] = expected_letter
            evaluation_result["level"] = level
            evaluation_result["evaluation_timestamp"] = None  # Will be set by the calling function
            
            return evaluation_result
            
        except json.JSONDecodeError as e:
            return {
                "is_acceptable": False,
                "identified_letter": "unknown",
                "matches_expected": False,
                "confidence_score": 0.0,
                "feedback": "Sorry, I had trouble evaluating your handwriting. Please try again.",
                "improvements": ["Write the letter clearly", "Make sure only one letter is visible"],
                "can_proceed": False,
                "level_appropriate": False,
                "error": f"JSON parsing error: {str(e)}"
            }
        except Exception as e:
            print(f"DEBUG: Gemini API error: {str(e)}")
            print(f"DEBUG: Error type: {type(e).__name__}")
            
            # Check if it's a quota issue
            if "quota" in str(e).lower() or "429" in str(e):
                print("DEBUG: Using mock evaluator due to quota limits")
                # Use mock evaluator when quota is exceeded
                mock_result = mock_evaluator.evaluate_handwriting(image_data, expected_letter, level)
                mock_result["quota_exceeded"] = True
                mock_result["original_error"] = f"API quota exceeded: {str(e)}"
                return mock_result
            else:
                return {
                    "is_acceptable": False,
                    "identified_letter": "unknown",
                    "matches_expected": False,
                    "confidence_score": 0.0,
                    "feedback": "Sorry, I had trouble evaluating your handwriting. Please try again.",
                    "improvements": ["Write the letter clearly", "Make sure only one letter is visible"],
                    "can_proceed": False,
                    "level_appropriate": False,
                    "error": f"Evaluation error: {str(e)}"
                }

# Singleton instance
evaluator = TamilHandwritingEvaluator()
