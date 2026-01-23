from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from database import get_collection
from datetime import datetime

router = APIRouter()

# Beginner level Tamil words
BEGINNER_WORDS = [
    {
        "id": "vanakkam",
        "tamil_text": "வணக்கம்",
        "english_translation": "Hello",
        "romanization": "Vanakkam"
    },
    {
        "id": "amma",
        "level": "beginner", 
        "tamil_text": "அம்மா",
        "english_translation": "Mother",
        "romanization": "Amma"
    },
    {
        "id": "appa",
        "tamil_text": "அப்பா", 
        "english_translation": "Father",
        "romanization": "Appa"
    },
    {
        "id": "nandri",
        "tamil_text": "நன்றி",
        "english_translation": "Thank you", 
        "romanization": "Nandri"
    },
    {
        "id": "po",
        "tamil_text": "போ",
        "english_translation": "Go",
        "romanization": "Po"
    }
]

@router.get("/beginner-words")
async def get_beginner_words():
    """Get all beginner level Tamil words"""
    return {
        "words": BEGINNER_WORDS,
        "total_count": len(BEGINNER_WORDS)
    }

@router.post("/save-attempt")
async def save_practice_attempt(attempt_data: Dict[str, Any]):
    """Save a voice practice attempt"""
    try:
        attempts_collection = get_collection("voice_attempts")
        
        # Add timestamp
        attempt_data["timestamp"] = datetime.utcnow()
        attempt_data["level"] = "beginner"
        
        # Save to database
        result = await attempts_collection.insert_one(attempt_data)
        
        return {
            "success": True,
            "attempt_id": str(result.inserted_id),
            "message": "Attempt saved successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save attempt: {str(e)}"
        )

@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user's progress for beginner level"""
    try:
        attempts_collection = get_collection("voice_attempts")
        
        # Get all attempts for this user
        user_attempts = await attempts_collection.find({
            "user_id": user_id,
            "level": "beginner"
        }).to_list(None)
        
        # Calculate best scores per word
        best_scores = {}
        for attempt in user_attempts:
            word_id = attempt.get("word_id")
            score = attempt.get("score", 0)
            
            if word_id not in best_scores or score > best_scores[word_id]:
                best_scores[word_id] = score
        
        # Calculate completion
        completed_words = sum(1 for score in best_scores.values() if score >= 80)
        completion_percentage = (completed_words / len(BEGINNER_WORDS)) * 100
        
        return {
            "user_id": user_id,
            "level": "beginner",
            "total_words": len(BEGINNER_WORDS),
            "completed_words": completed_words,
            "completion_percentage": completion_percentage,
            "best_scores": best_scores,
            "is_completed": completion_percentage >= 80
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress: {str(e)}"
        )
