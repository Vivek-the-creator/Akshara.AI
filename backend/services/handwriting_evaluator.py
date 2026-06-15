import os
import base64
import json
from typing import Dict, Any
from groq import Groq
from PIL import Image
import io
from dotenv import load_dotenv
from .mock_handwriting_evaluator import mock_evaluator

load_dotenv()

class TamilHandwritingEvaluator:
    """AI-powered Tamil handwriting evaluation service"""

    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables")
        self.client = Groq(api_key=api_key)
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"

        self.tamil_levels = {
            "beginner": ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"],
            "intermediate": ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"],
            "advanced": ["க்", "ங்", "ச்", "ஞ்", "ட்", "ண்", "த்", "ந்", "ப்", "ம்", "ய்", "ர்", "ல்", "வ்", "ழ்", "ள்", "ற்", "ன்"]
        }

    def _prepare_image_b64(self, image_data: bytes) -> str:
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        if max(image.size) > 1024:
            image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    def _create_evaluation_prompt(self, expected_letter: str, level: str) -> str:
        level_letters = self.tamil_levels.get(level, self.tamil_levels["beginner"])
        return f"""You are an expert Tamil handwriting evaluator for children's education.

TASK: Evaluate a handwritten Tamil letter and provide educational assessment.

EXPECTED LETTER: {expected_letter}
CURRENT LEVEL: {level}
ACCEPTABLE LETTERS FOR THIS LEVEL: {', '.join(level_letters)}

EVALUATION CRITERIA:
1. Identify if the handwritten letter matches the expected letter: {expected_letter}
2. Assess if the structure is ACCEPTABLE for a child's learning level
3. Be lenient with minor variations in curve shapes, line thickness, slight tilt, minor stroke order
4. REJECT if: letter clearly matches a DIFFERENT Tamil character, image is blank/scribbles, multiple letters, completely unrecognizable

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

IMPORTANT: Return ONLY the JSON object, no markdown or extra text."""

    def evaluate_handwriting(self, image_data: bytes, expected_letter: str, level: str = "beginner") -> Dict[str, Any]:
        try:
            b64 = self._prepare_image_b64(image_data)
            prompt = self._create_evaluation_prompt(expected_letter, level)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}}
                    ]
                }],
                response_format={"type": "json_object"}
            )

            evaluation_result = json.loads(response.choices[0].message.content)
            evaluation_result["expected_letter"] = expected_letter
            evaluation_result["level"] = level
            evaluation_result["evaluation_timestamp"] = None
            return evaluation_result

        except json.JSONDecodeError as e:
            return {
                "is_acceptable": False, "identified_letter": "unknown",
                "matches_expected": False, "confidence_score": 0.0,
                "feedback": "Sorry, I had trouble evaluating your handwriting. Please try again.",
                "improvements": ["Write the letter clearly", "Make sure only one letter is visible"],
                "can_proceed": False, "level_appropriate": False,
                "error": f"JSON parsing error: {str(e)}"
            }
        except Exception as e:
            if "quota" in str(e).lower() or "429" in str(e) or "rate" in str(e).lower():
                mock_result = mock_evaluator.evaluate_handwriting(image_data, expected_letter, level)
                mock_result["quota_exceeded"] = True
                mock_result["original_error"] = f"API quota exceeded: {str(e)}"
                return mock_result
            return {
                "is_acceptable": False, "identified_letter": "unknown",
                "matches_expected": False, "confidence_score": 0.0,
                "feedback": "Sorry, I had trouble evaluating your handwriting. Please try again.",
                "improvements": ["Write the letter clearly", "Make sure only one letter is visible"],
                "can_proceed": False, "level_appropriate": False,
                "error": f"Evaluation error: {str(e)}"
            }

evaluator = TamilHandwritingEvaluator()
