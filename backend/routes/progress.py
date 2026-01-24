from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import WritingProgressResponse, WritingProgressCreate, PyObjectId
from routes.auth import get_current_user
from database import get_collection
from bson import ObjectId

router = APIRouter()

@router.get("/user")
async def get_user_progress_by_params(
    stage: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's progress by stage and category (frontend compatible endpoint)"""
    progress_collection = get_collection("writing_progress")
    
    # Build query filter - handle both string and ObjectId user IDs
    user_id = str(current_user.get("_id", current_user.get("id")))
    print(f"Getting user progress with filter: {{user_id: {user_id}, stage: {stage}, category: {category}}}")
    
    query_filter = {"user_id": user_id}
    if stage:
        query_filter["stage"] = stage.lower()  # Convert to lowercase for consistency
    if category:
        query_filter["category"] = category.lower().replace("%20", " ")  # Handle URL encoding and case
    
    # Get progress records
    cursor = progress_collection.find(query_filter).sort("level_number", 1)
    progress_records = await cursor.to_list(length=100)
    
    print(f"Found {len(progress_records)} progress records")
    
    # Convert to dict format for frontend compatibility
    progress_list = []
    for record in progress_records:
        progress_dict = {
            "id": str(record["_id"]),
            "user_id": record["user_id"],
            "language": record.get("language", "Tamil"),
            "stage": record.get("stage"),
            "category": record.get("category"),
            "level_number": record.get("level_number"),
            "expected_character": record.get("expected_character"),
            "attempts_count": record.get("attempts_count", 0),
            "stars_awarded": record.get("stars_awarded", 0),
            "completed_at": record.get("completed_at"),
            "created_at": record.get("created_at"),
            "updated_at": record.get("updated_at")
        }
        progress_list.append(progress_dict)
    
    return progress_list

@router.get("/level/{stage}/{category}/{level_number}")
async def get_level_progress(
    stage: str,
    category: str,
    level_number: int,
    current_user: dict = Depends(get_current_user)
):
    """Get progress for a specific level"""
    progress_collection = get_collection("writing_progress")
    
    # Find specific level progress
    user_id = str(current_user.get("_id", current_user.get("id")))
    record = await progress_collection.find_one({
        "user_id": user_id,
        "stage": stage.lower(),  # Convert to lowercase
        "category": category.replace("%20", " ").lower(),  # Handle URL encoding and case
        "level_number": level_number
    })
    
    if record:
        return {
            "id": str(record["_id"]),
            "user_id": record["user_id"],
            "language": record.get("language", "Tamil"),
            "stage": record.get("stage"),
            "category": record.get("category"),
            "level_number": record.get("level_number"),
            "expected_character": record.get("expected_character"),
            "attempts_count": record.get("attempts_count", 0),
            "stars_awarded": record.get("stars_awarded", 0),
            "completed_at": record.get("completed_at"),
            "created_at": record.get("created_at"),
            "updated_at": record.get("updated_at")
        }
    else:
        # Return default progress if not found
        return {
            "id": None,
            "user_id": user_id,
            "language": "Tamil",
            "stage": stage.lower(),  # Use lowercase
            "category": category.replace("%20", " ").lower(),  # Use lowercase
            "level_number": level_number,
            "expected_character": None,
            "attempts_count": 0,
            "stars_awarded": 0,
            "completed_at": None,
            "created_at": None,
            "updated_at": None
        }

@router.post("/progress", response_model=WritingProgressResponse, status_code=status.HTTP_201_CREATED)
async def create_or_update_progress(
    progress: WritingProgressCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create or update writing progress"""
    progress_collection = get_collection("writing_progress")
    
    # Check if progress record already exists for this user, stage, category, and level
    user_id = str(current_user.get("_id", current_user.get("id")))
    print(f"Looking for progress with user_id: {user_id}")
    
    existing_progress = await progress_collection.find_one({
        "user_id": user_id,
        "stage": progress.stage.lower(),  # Convert to lowercase for consistency
        "category": progress.category.lower(),
        "level_number": progress.level_number
    })
    
    progress_doc = {
        "user_id": user_id,
        "language": progress.language,
        "stage": progress.stage.lower(),  # Store in lowercase
        "category": progress.category.lower(),  # Store in lowercase
        "level_number": progress.level_number,
        "expected_character": progress.expected_character,
        "attempts_count": progress.attempts_count,
        "stars_awarded": progress.stars_awarded,
        "completed_at": progress.completed_at,
        "updated_at": datetime.utcnow()
    }
    
    if existing_progress:
        # Update existing record
        await progress_collection.update_one(
            {"_id": existing_progress["_id"]},
            {"$set": progress_doc}
        )
        progress_doc["_id"] = existing_progress["_id"]
        progress_doc["created_at"] = existing_progress["created_at"]
    else:
        # Create new record
        progress_doc["created_at"] = datetime.utcnow()
        result = await progress_collection.insert_one(progress_doc)
        progress_doc["_id"] = result.inserted_id
    
    return WritingProgressResponse(
        id=progress_doc["_id"],
        user_id=progress_doc["user_id"],
        language=progress_doc["language"],
        stage=progress_doc["stage"],
        category=progress_doc["category"],
        level_number=progress_doc["level_number"],
        expected_character=progress_doc["expected_character"],
        attempts_count=progress_doc["attempts_count"],
        stars_awarded=progress_doc["stars_awarded"],
        completed_at=progress_doc["completed_at"],
        created_at=progress_doc["created_at"],
        updated_at=progress_doc["updated_at"]
    )

@router.get("/progress", response_model=List[WritingProgressResponse])
async def get_user_progress(
    stage: Optional[str] = None,
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get user's writing progress"""
    progress_collection = get_collection("writing_progress")
    
    # Build query filter
    query_filter = {"user_id": str(current_user["_id"])}
    if stage:
        query_filter["stage"] = stage
    if category:
        query_filter["category"] = category
    
    # Get progress records
    cursor = progress_collection.find(query_filter).sort("level_number", 1)
    progress_records = await cursor.to_list(length=100)
    
    progress_list = []
    for record in progress_records:
        progress_list.append(WritingProgressResponse(
            id=record["_id"],
            user_id=record["user_id"],
            language=record["language"],
            stage=record["stage"],
            category=record["category"],
            level_number=record["level_number"],
            expected_character=record["expected_character"],
            attempts_count=record["attempts_count"],
            stars_awarded=record["stars_awarded"],
            completed_at=record.get("completed_at"),
            created_at=record["created_at"],
            updated_at=record["updated_at"]
        ))
    
    return progress_list

@router.get("/progress/{stage}/{category}/{level_number}", response_model=WritingProgressResponse)
async def get_level_progress(
    stage: str,
    category: str,
    level_number: int,
    current_user: dict = Depends(get_current_user)
):
    """Get progress for a specific level"""
    progress_collection = get_collection("writing_progress")
    
    progress_record = await progress_collection.find_one({
        "user_id": str(current_user["_id"]),
        "stage": stage,
        "category": category,
        "level_number": level_number
    })
    
    if not progress_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Progress record not found for this level"
        )
    
    return WritingProgressResponse(
        id=progress_record["_id"],
        user_id=progress_record["user_id"],
        language=progress_record["language"],
        stage=progress_record["stage"],
        category=progress_record["category"],
        level_number=progress_record["level_number"],
        expected_character=progress_record["expected_character"],
        attempts_count=progress_record["attempts_count"],
        stars_awarded=progress_record["stars_awarded"],
        completed_at=progress_record.get("completed_at"),
        created_at=progress_record["created_at"],
        updated_at=progress_record["updated_at"]
    )

@router.get("/progress/summary")
async def get_progress_summary(
    current_user: dict = Depends(get_current_user)
):
    """Get summary of user's overall progress"""
    progress_collection = get_collection("writing_progress")
    
    # Get all progress for user
    cursor = progress_collection.find({"user_id": str(current_user["_id"])})
    all_progress = await cursor.to_list(length=200)
    
    # Calculate summary statistics
    total_levels = len(all_progress)
    completed_levels = len([p for p in all_progress if p.get("completed_at")])
    total_stars = sum(p.get("stars_awarded", 0) for p in all_progress)
    total_attempts = sum(p.get("attempts_count", 0) for p in all_progress)
    
    # Group by stage
    stage_progress = {}
    for record in all_progress:
        stage = record["stage"]
        if stage not in stage_progress:
            stage_progress[stage] = {
                "total": 0,
                "completed": 0,
                "stars": 0
            }
        stage_progress[stage]["total"] += 1
        if record.get("completed_at"):
            stage_progress[stage]["completed"] += 1
        stage_progress[stage]["stars"] += record.get("stars_awarded", 0)
    
    return {
        "total_levels": total_levels,
        "completed_levels": completed_levels,
        "total_stars": total_stars,
        "total_attempts": total_attempts,
        "completion_rate": (completed_levels / total_levels * 100) if total_levels > 0 else 0,
        "stage_progress": stage_progress
    }
