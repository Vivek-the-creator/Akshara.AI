import random
from typing import Dict, Any

class MockHandwritingEvaluator:
    """Mock handwriting evaluator for testing when API quota is exhausted"""
    
    def __init__(self):
        pass
    
    def evaluate_handwriting(self, image_data: bytes, expected_letter: str, level: str = "beginner") -> Dict[str, Any]:
        """
        Mock evaluation of handwritten Tamil letter
        Returns realistic evaluation results for testing
        """
        
        # Simulate realistic evaluation based on expected letter
        # For demo purposes, we'll randomly accept/reject with bias toward acceptance
        
        # 70% chance of acceptance for demo
        is_acceptable = random.random() < 0.7
        
        # Generate realistic feedback
        if is_acceptable:
            feedback_messages = [
                "Excellent! அருமை! (Awesome!) You have written the letter correctly!",
                "Great job! Your letter formation is excellent.",
                "Very good! The letter is clear and well-formed.",
                "Excellent work! Your handwriting shows good practice.",
                "Wonderful! The letter structure is correct and clear.",
                "Perfect! Your letter matches the expected shape well."
            ]
            improvements = []
            can_proceed = True
            confidence_score = random.uniform(0.75, 0.95)
        else:
            feedback_messages = [
                "Excellent! அருமை! (Awesome!) You have written the letter 'ஆ' beautifully! Your strokes are clear and well-formed. Keep up the great work!",
                "Good attempt! Let's work on making the letter clearer.",
                "Nice try! The letter needs a bit more practice.",
                "Keep practicing! The letter shape needs improvement.",
                "Almost there! Focus on the basic structure.",
                "Good effort! Let's refine the letter formation."
            ]
            improvements = [
                "Make the curves smoother and more consistent",
                "Pay attention to the proportions of the letter",
                "Practice the basic strokes more carefully",
                "Ensure the letter is centered and balanced",
                "Work on making the lines more confident"
            ]
            can_proceed = False
            confidence_score = random.uniform(0.3, 0.6)
        
        return {
            "is_acceptable": is_acceptable,
            "identified_letter": expected_letter if is_acceptable else "unclear",
            "matches_expected": is_acceptable,
            "confidence_score": confidence_score,
            "feedback": random.choice(feedback_messages),
            "improvements": random.sample(improvements, 2) if not is_acceptable else [],
            "can_proceed": can_proceed,
            "level_appropriate": True,
            "expected_letter": expected_letter,
            "level": level,
            "evaluation_timestamp": None,
            "mock_evaluation": True  # Flag to indicate this is mock data
        }

# Create singleton instance
mock_evaluator = MockHandwritingEvaluator()
