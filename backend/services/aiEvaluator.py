import os
import json
import base64
from typing import Dict, Any, Optional
import google.generativeai as genai
from PIL import Image
import io

class AIEvaluator:
    def __init__(self):
        # Initialize Gemini API
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Warning: GEMINI_API_KEY not found in environment variables. AI evaluation will be disabled.")
            self.enabled = False
            return
        
        try:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self.enabled = True
        except Exception as e:
            print(f"Error initializing Gemini API: {str(e)}")
            self.enabled = False
        
        # System prompt for handwriting evaluation
        self.system_prompt = """You are an expert AI-powered Handwriting Tutor for children learning to write Tamil letters.

TECH STACK CONTEXT:
- You are analyzing handwritten letter images uploaded by children
- Users are kids learning to write letters step-by-step
- Your evaluation directly controls level progression in the learning app

CORE GOAL:
Analyze a handwritten letter image uploaded by a child and decide:
1) Whether the letter is ACCEPTABLE for the current level
2) Whether the child can move to the NEXT level
3) Provide encouragement and gentle improvement suggestions

EVALUATION RULES (VERY IMPORTANT):

1️⃣ LETTER MATCH (MOST IMPORTANT)
- Check whether the handwritten letter visually matches the expected_letter.
- If the letter looks closer to a DIFFERENT Tamil letter (example: "ஆ" instead of "அ"), mark it as INCORRECT.
- Do NOT guess or auto-correct.

2️⃣ STRICTNESS BALANCE (CRITICAL)
- Be TOLERANT of:
  - Small stroke variations
  - Slight size imbalance
  - Handwritten shakiness (child writing)
- Be STRICT about:
  - Extra tails or strokes that change the letter identity
  - Missing core structure of the letter
  - Clearly writing a different Tamil letter

3️⃣ LEVEL-BASED EXPECTATION
- Beginner levels:
  - Accept slightly imperfect shapes if letter identity is clear
- Intermediate levels:
  - Expect better proportions and cleaner strokes
- Pro levels:
  - Expect near-correct traditional letter form

4️⃣ PROGRESSION LOGIC
- If letter is ACCEPTABLE → allow_next_level = true
- If letter is NOT acceptable → allow_next_level = false
- Do NOT allow progression if the letter is incorrect or misleading

5️⃣ FEEDBACK STYLE (CHILD-FRIENDLY)
- Always be encouraging
- Never use harsh language
- If incorrect, gently suggest how to improve
- If correct, praise clearly and positively

OUTPUT FORMAT (JSON ONLY – NO EXTRA TEXT):
{
  "is_correct": true | false,
  "allow_next_level": true | false,
  "confidence": number between 0.0 and 1.0,
  "feedback": {
    "appreciation": "short positive sentence for the child",
    "improvement_tips": [
      "tip 1 (simple, gentle)",
      "tip 2 (optional)",
      "tip 3 (optional)"
    ]
  },
  "detected_letter": "what letter it visually resembles",
  "reasoning": "one short technical explanation for developers"
}

IMPORTANT FINAL NOTES:
- If the letter is ambiguous → treat as incorrect
- Never be overly strict for beginner levels
- Never be overly liberal to the point of accepting wrong letters
- Your decision directly controls level unlocking
- JSON output must be perfectly valid and parsable"""

    def prepare_image_for_analysis(self, image_data: bytes) -> Image.Image:
        """Prepare image for Gemini API analysis"""
        try:
            # Open and process image
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize if too large (Gemini has limits)
            max_size = 1024
            if max(image.size) > max_size:
                image.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
            
            return image
        except Exception as e:
            raise ValueError(f"Failed to process image: {str(e)}")

    def create_evaluation_prompt(self, language: str, stage: str, level_number: int, expected_letter: str) -> str:
        """Create the evaluation prompt for Gemini"""
        return f"""You are a handwriting teacher for young children.

The expected letter is: {expected_letter}
Language: {language}
Level: {stage} - Level {level_number}

Analyze the uploaded handwritten image.

Rules:
- Do NOT use OCR-style strict matching
- Judge like a human teacher
- If the letter is clearly recognizable as {expected_letter}, ACCEPT it
- Minor stroke issues are allowed
- Reject only if the letter is clearly incorrect or unreadable

Return a JSON response ONLY in this format:

{{
  "is_correct": true | false,
  "confidence": number (0 to 100),
  "feedback": "short encouraging feedback",
  "improvements": ["tip 1", "tip 2"],
  "can_proceed": true | false
}}

Guidelines:
- confidence >= 70 → acceptable
- confidence < 70 → retry
- Be encouraging and child-friendly"""

    async def evaluate_handwriting(
        self, 
        image_data: bytes, 
        language: str, 
        stage: str, 
        level_number: int, 
        expected_letter: str
    ) -> Dict[str, Any]:
        """Evaluate handwritten letter using Gemini Vision API"""
        
        # Check if AI evaluation is enabled
        if not self.enabled:
            return {
                "is_correct": False,
                "confidence": 0,
                "feedback": "AI evaluation not available",
                "improvements": ["Please configure GEMINI_API_KEY"],
                "can_proceed": False
            }
        
        try:
            # Prepare image
            image = self.prepare_image_for_analysis(image_data)
            
            # Create prompt
            prompt = self.create_evaluation_prompt(language, stage, level_number, expected_letter)
            
            # Generate content with Gemini
            response = self.model.generate_content([prompt, image])
            
            # Extract and parse response
            response_text = response.text.strip()
            
            # Clean up response text (remove any markdown code blocks)
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON response
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError as e:
                # Fallback response if JSON parsing fails
                result = {
                    "is_correct": False,
                    "confidence": 0,
                    "feedback": "Thank you for trying!",
                    "improvements": ["Please write the letter more clearly"],
                    "can_proceed": False
                }
            
            # Validate required fields and normalize
            normalized_result = {
                "is_correct": bool(result.get("is_correct", False)),
                "confidence": min(100, max(0, int(result.get("confidence", 0)))),
                "feedback": str(result.get("feedback", "Good effort!")),
                "improvements": result.get("improvements", []),
                "can_proceed": bool(result.get("can_proceed", result.get("is_correct", False)))
            }
            
            # Ensure improvements is a list
            if not isinstance(normalized_result["improvements"], list):
                normalized_result["improvements"] = [str(normalized_result["improvements"])]
            
            return normalized_result
            
        except Exception as e:
            # Fallback response for any errors
            return {
                "is_correct": False,
                "confidence": 0,
                "feedback": "Thank you for your submission!",
                "improvements": ["Please try again. Make sure the image is clear and shows only one letter."],
                "can_proceed": False
            }

# Create singleton instance
ai_evaluator = AIEvaluator()
