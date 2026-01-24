from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from fastapi.responses import JSONResponse
from typing import Optional
import base64
import io
from datetime import datetime
from services.handwriting_evaluator import evaluator
from database import get_collection
from routes.auth import get_current_user

router = APIRouter()

@router.post("/evaluate")
async def evaluate_handwriting(
    image: UploadFile = File(...),
    expected_letter: str = Form(...),
    level: str = Form(default="beginner"),
    current_user: dict = Depends(get_current_user)
):
    """
    Evaluate handwritten Tamil letter using AI
    
    Args:
        image: Handwritten letter image file
        expected_letter: The Tamil letter that should be written
        level: Current learning level (beginner, intermediate, advanced)
        current_user: Authenticated user
    
    Returns:
        Evaluation result with feedback and recommendations
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Check file size (max 10MB)
        if len(image_data) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Image file too large (max 10MB)")
        
        # Perform AI evaluation
        evaluation_result = evaluator.evaluate_handwriting(
            image_data=image_data,
            expected_letter=expected_letter,
            level=level
        )
        
        # Add timestamp and user info
        evaluation_result["user_id"] = current_user.get("id")
        evaluation_result["evaluation_timestamp"] = datetime.utcnow().isoformat()
        
        # Store evaluation in database
        try:
            evaluations_collection = get_collection("handwriting_evaluations")
            await evaluations_collection.insert_one(evaluation_result.copy())
        except Exception as db_error:
            # Log database error but don't fail the evaluation
            print(f"Database storage error: {db_error}")
        
        # Remove sensitive fields from response
        response_result = evaluation_result.copy()
        if "error" in response_result:
            response_result.pop("error")
        
        return JSONResponse(content=response_result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Evaluation failed: {str(e)}"
        )

@router.get("/levels")
async def get_learning_levels():
    """Get available learning levels and Tamil letters for each level"""
    return {
        "levels": {
            "beginner": {
                "description": "Basic Tamil vowels (uyir ezhuthukkal)",
                "letters": ["அ", "ஆ", "இ", "ஈ", "உ", "ஊ", "எ", "ஏ", "ஐ", "ஒ", "ஓ", "ஔ"]
            },
            "intermediate": {
                "description": "Tamil consonants (mey ezhuthukkal)",
                "letters": ["க", "ங", "ச", "ஞ", "ட", "ண", "த", "ந", "ப", "ம", "ய", "ர", "ல", "வ", "ழ", "ள", "ற", "ன"]
            },
            "advanced": {
                "description": "Tamil consonants with pulli (hard consonants)",
                "letters": ["க்", "ங்", "ச்", "ஞ்", "ட்", "ண்", "த்", "ந்", "ப்", "ம்", "ய்", "ர்", "ல்", "வ்", "ழ்", "ள்", "ற்", "ன்"]
            }
        }
    }

@router.get("/history")
async def get_evaluation_history(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get user's handwriting evaluation history"""
    try:
        evaluations_collection = get_collection("handwriting_evaluations")
        
        # Get user's evaluation history
        cursor = evaluations_collection.find(
            {"user_id": current_user.get("id")}
        ).sort("evaluation_timestamp", -1).limit(limit)
        
        history = []
        async for doc in cursor:
            # Convert ObjectId to string and remove sensitive fields
            doc.pop("_id", None)
            doc.pop("user_id", None)
            if "error" in doc:
                doc.pop("error")
            history.append(doc)
        
        return {"history": history, "total": len(history)}
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve history: {str(e)}"
        )

@router.get("/stats")
async def get_evaluation_stats(current_user: dict = Depends(get_current_user)):
    """Get user's handwriting evaluation statistics"""
    try:
        evaluations_collection = get_collection("handwriting_evaluations")
        
        # Aggregate user's stats
        pipeline = [
            {"$match": {"user_id": current_user.get("id")}},
            {"$group": {
                "_id": None,
                "total_evaluations": {"$sum": 1},
                "acceptable_count": {
                    "$sum": {"$cond": [{"$eq": ["$is_acceptable", True]}, 1, 0]}
                },
                "can_proceed_count": {
                    "$sum": {"$cond": [{"$eq": ["$can_proceed", True]}, 1, 0]}
                },
                "avg_confidence": {"$avg": "$confidence_score"}
            }}
        ]
        
        result = await evaluations_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            stats = result[0]
            stats.pop("_id", None)
            stats["success_rate"] = (
                stats["acceptable_count"] / stats["total_evaluations"] * 100
                if stats["total_evaluations"] > 0 else 0
            )
        else:
            stats = {
                "total_evaluations": 0,
                "acceptable_count": 0,
                "can_proceed_count": 0,
                "avg_confidence": 0.0,
                "success_rate": 0.0
            }
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve stats: {str(e)}"
        )
