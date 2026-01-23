from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from models_voice import VoicePracticeContent, VoicePracticeAttempt, VoicePracticeProgress
from database import get_collection
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Sample Tamil content for each level
BEGINNER_CONTENT = [
    {
        "id": "vanakkam",
        "level": "beginner",
        "tamil_text": "வணக்கம்",
        "english_translation": "Hello",
        "romanization": "Vanakkam",
        "difficulty_score": 1.0
    },
    {
        "id": "amma",
        "level": "beginner", 
        "tamil_text": "அம்மா",
        "english_translation": "Mother",
        "romanization": "Amma",
        "difficulty_score": 1.2
    },
    {
        "id": "appa",
        "level": "beginner",
        "tamil_text": "அப்பா", 
        "english_translation": "Father",
        "romanization": "Appa",
        "difficulty_score": 1.2
    },
    {
        "id": "nandri",
        "level": "beginner",
        "tamil_text": "நன்றி",
        "english_translation": "Thank you", 
        "romanization": "Nandri",
        "difficulty_score": 1.5
    },
    {
        "id": "po",
        "level": "beginner",
        "tamil_text": "போ",
        "english_translation": "Go",
        "romanization": "Po", 
        "difficulty_score": 1.0
    }
]

INTERMEDIATE_CONTENT = [
    {
        "id": "en_peyar_ravi",
        "level": "intermediate",
        "tamil_text": "என் பெயர் ரவி",
        "english_translation": "My name is Ravi",
        "romanization": "En peyar Ravi",
        "difficulty_score": 3.0
    },
    {
        "id": "neenga_epadi_irukkeenga",
        "level": "intermediate",
        "tamil_text": "நீங்கள் எப்படி இருக்கிறீர்கள்",
        "english_translation": "How are you?",
        "romanization": "Neenga epadi irukkeenga",
        "difficulty_score": 4.0
    }
]

ADVANCED_CONTENT = [
    {
        "id": "naan_tamil_pesuren",
        "level": "advanced",
        "tamil_text": "நான் தமிழ் பேசுறேன்",
        "english_translation": "I speak Tamil",
        "romanization": "Naan Tamil pesuren",
        "difficulty_score": 6.0
    }
]

@router.get("/levels")
async def get_voice_practice_levels():
    """Get all available voice practice levels"""
    return {
        "levels": [
            {
                "id": "beginner",
                "display_name": "Beginner",
                "description": "Learn basic Tamil words",
                "total_items": len(BEGINNER_CONTENT),
                "unlock_threshold": 80.0,
                "completion_threshold": 80.0
            },
            {
                "id": "intermediate", 
                "display_name": "Intermediate",
                "description": "Practice Tamil phrases",
                "total_items": len(INTERMEDIATE_CONTENT),
                "unlock_threshold": 80.0,
                "completion_threshold": 80.0
            },
            {
                "id": "advanced",
                "display_name": "Advanced", 
                "description": "Master Tamil sentences",
                "total_items": len(ADVANCED_CONTENT),
                "unlock_threshold": 85.0,
                "completion_threshold": 85.0
            }
        ]
    }

@router.get("/content/{level}")
async def get_level_content(level: str):
    """Get content for a specific level"""
    if level == "beginner":
        return {"content": BEGINNER_CONTENT}
    elif level == "intermediate":
        return {"content": INTERMEDIATE_CONTENT}
    elif level == "advanced":
        return {"content": ADVANCED_CONTENT}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Level not found"
        )

@router.post("/attempt")
async def submit_voice_attempt(attempt: VoicePracticeAttempt):
    """Submit a voice practice attempt"""
    try:
        attempts_collection = get_collection("voice_practice_attempts")
        progress_collection = get_collection("voice_practice_progress")
        
        # Save the attempt
        attempt.timestamp = datetime.utcnow()
        attempt_dict = attempt.dict()
        
        result = await attempts_collection.insert_one(attempt_dict)
        
        # Update progress
        user_progress = await progress_collection.find_one({
            "user_id": attempt.user_id,
            "level": attempt.level
        })
        
        if not user_progress:
            # Create new progress record
            total_items = len(BEGINNER_CONTENT) if attempt.level == "beginner" else \
                          len(INTERMEDIATE_CONTENT) if attempt.level == "intermediate" else \
                          len(ADVANCED_CONTENT)
            
            progress = {
                "user_id": attempt.user_id,
                "level": attempt.level,
                "total_items": total_items,
                "completed_items": 0,
                "best_scores": {attempt.content_id: attempt.pronunciation_accuracy},
                "level_unlocked": attempt.level == "beginner",  # Beginner unlocked by default
                "level_completed": False,
                "completion_percentage": 0.0,
                "last_attempt": datetime.utcnow()
            }
            await progress_collection.insert_one(progress)
        else:
            # Update existing progress
            current_best = user_progress.get("best_scores", {}).get(attempt.content_id, 0)
            if attempt.pronunciation_accuracy > current_best:
                user_progress["best_scores"][attempt.content_id] = attempt.pronunciation_accuracy
            
            # Calculate completion percentage
            completed_count = sum(1 for score in user_progress["best_scores"].values() 
                                if score >= 80.0)  # 80% threshold
            user_progress["completed_items"] = completed_count
            user_progress["completion_percentage"] = (completed_count / user_progress["total_items"]) * 100
            user_progress["last_attempt"] = datetime.utcnow()
            
            # Check if level is completed
            if user_progress["completion_percentage"] >= 80.0:
                user_progress["level_completed"] = True
            
            await progress_collection.update_one(
                {"user_id": attempt.user_id, "level": attempt.level},
                {"$set": user_progress}
            )
        
        return {
            "success": True,
            "attempt_id": str(result.inserted_id),
            "score": attempt.pronunciation_accuracy,
            "message": "Attempt recorded successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save attempt: {str(e)}"
        )

@router.get("/progress/{user_id}")
async def get_user_progress(user_id: str):
    """Get user's voice practice progress"""
    try:
        progress_collection = get_collection("voice_practice_progress")
        
        progress = await progress_collection.find({"user_id": user_id}).to_list(None)
        
        # Format response
        result = {}
        for p in progress:
            result[p["level"]] = {
                "completed_items": p["completed_items"],
                "total_items": p["total_items"],
                "completion_percentage": p["completion_percentage"],
                "level_unlocked": p["level_unlocked"],
                "level_completed": p["level_completed"],
                "best_scores": p["best_scores"]
            }
        
        return {"progress": result}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get progress: {str(e)}"
        )

@router.post("/unlock-level")
async def unlock_level(user_id: str, level: str):
    """Unlock a level based on previous completion"""
    try:
        progress_collection = get_collection("voice_practice_progress")
        
        # Check if previous level is completed
        if level == "intermediate":
            beginner_progress = await progress_collection.find_one({
                "user_id": user_id,
                "level": "beginner"
            })
            if not beginner_progress or not beginner_progress.get("level_completed", False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Complete beginner level first"
                )
        
        elif level == "advanced":
            intermediate_progress = await progress_collection.find_one({
                "user_id": user_id,
                "level": "intermediate"
            })
            if not intermediate_progress or not intermediate_progress.get("level_completed", False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Complete intermediate level first"
                )
        
        # Unlock the level
        await progress_collection.update_one(
            {"user_id": user_id, "level": level},
            {"$set": {"level_unlocked": True}},
            upsert=True
        )
        
        return {"success": True, "message": f"{level} level unlocked"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to unlock level: {str(e)}"
        )
