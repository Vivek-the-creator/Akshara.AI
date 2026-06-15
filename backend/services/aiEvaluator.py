import os
import json
import base64
from typing import Dict, Any
from groq import Groq
from PIL import Image
import io

class AIEvaluator:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            print("Warning: GROQ_API_KEY not found. AI evaluation will be disabled.")
            self.enabled = False
            return
        try:
            self.client = Groq(api_key=api_key)
            self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
            self.enabled = True
        except Exception as e:
            print(f"Error initializing Groq API: {str(e)}")
            self.enabled = False

    def _image_to_base64(self, image_data: bytes) -> str:
        image = Image.open(io.BytesIO(image_data))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        if max(image.size) > 1024:
            image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        buf = io.BytesIO()
        image.save(buf, format="JPEG")
        return base64.b64encode(buf.getvalue()).decode("utf-8")

    def create_evaluation_prompt(self, language: str, stage: str, level_number: int, expected_letter: str) -> str:
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
        if not self.enabled:
            return {
                "is_correct": False, "confidence": 0,
                "feedback": "AI evaluation not available",
                "improvements": ["Please configure GROQ_API_KEY"],
                "can_proceed": False
            }
        try:
            b64 = self._image_to_base64(image_data)
            prompt = self.create_evaluation_prompt(language, stage, level_number, expected_letter)

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

            result = json.loads(response.choices[0].message.content)
            return {
                "is_correct": bool(result.get("is_correct", False)),
                "confidence": min(100, max(0, int(result.get("confidence", 0)))),
                "feedback": str(result.get("feedback", "Good effort!")),
                "improvements": result.get("improvements", []) if isinstance(result.get("improvements"), list) else [],
                "can_proceed": bool(result.get("can_proceed", result.get("is_correct", False)))
            }
        except Exception:
            return {
                "is_correct": False, "confidence": 0,
                "feedback": "Thank you for your submission!",
                "improvements": ["Please try again. Make sure the image is clear and shows only one letter."],
                "can_proceed": False
            }

ai_evaluator = AIEvaluator()
