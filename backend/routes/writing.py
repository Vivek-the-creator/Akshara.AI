from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional, Dict, Any
from datetime import datetime
from models import WritingSessionResponse, WritingSessionCreate, PyObjectId
from routes.auth import get_current_user
from database import get_collection
from bson import ObjectId
import os
from dotenv import load_dotenv
from services.aiEvaluator import ai_evaluator

load_dotenv()

router = APIRouter()

@router.post("/evaluate", status_code=status.HTTP_200_OK)
async def evaluate_handwriting(
    file: UploadFile = File(...),
    language: str = Form(...),
    stage: str = Form(...),
    level_number: int = Form(...),
    expected_letter: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """Evaluate handwritten letter using Gemini Vision API"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate language
    if language not in ["Tamil", "Telugu", "Hindi"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid language. Must be: Tamil, Telugu, or Hindi"
        )
    
    # Validate stage
    if stage not in ["beginner", "intermediate", "pro"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid stage. Must be: beginner, intermediate, or pro"
        )
    
    # Validate level number
    if level_number < 1 or level_number > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Level number must be between 1 and 50"
        )
    
    # Validate expected letter
    if not expected_letter or len(expected_letter.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expected letter is required"
        )
    
    try:
        # Read image data
        image_data = await file.read()
        
        # Evaluate using AI
        evaluation_result = await ai_evaluator.evaluate_handwriting(
            image_data=image_data,
            language=language,
            stage=stage,
            level_number=level_number,
            expected_letter=expected_letter.strip()
        )
        
        # Save the image for record keeping
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_filename = f"eval_{current_user['_id']}_{datetime.utcnow().timestamp()}.{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(image_data)
        
        # Create evaluation record
        evaluations_collection = get_collection("handwriting_evaluations")
        evaluation_doc = {
            "user_id": str(current_user["_id"]),
            "language": language,
            "stage": stage,
            "level_number": level_number,
            "expected_letter": expected_letter.strip(),
            "image_path": file_path,
            "original_filename": file.filename,
            "evaluation_result": evaluation_result,
            "created_at": datetime.utcnow()
        }
        
        await evaluations_collection.insert_one(evaluation_doc)
        
        return {
            "success": True,
            "evaluation": evaluation_result,
            "metadata": {
                "language": language,
                "stage": stage,
                "level_number": level_number,
                "expected_letter": expected_letter.strip(),
                "evaluated_at": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error evaluating handwriting: {str(e)}"
        )

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_writing_image(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    """Upload an image for writing analysis (placeholder implementation)"""
    
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Create upload directory if it doesn't exist
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    unique_filename = f"{current_user['_id']}_{datetime.utcnow().timestamp()}.{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error saving file: {str(e)}"
        )
    
    # Create writing session record
    writing_sessions_collection = get_collection("writing_sessions")
    session_doc = {
        "user_id": str(current_user["_id"]),
        "title": title or f"Writing Session {datetime.utcnow().strftime('%Y-%m-%d %H:%M')}",
        "image_path": file_path,
        "original_filename": file.filename,
        "content": None,  # Will be populated after OCR processing
        "language": current_user.get("learning_language", "en"),
        "status": "uploaded",  # uploaded, processing, completed, error
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await writing_sessions_collection.insert_one(session_doc)
    
    return {
        "message": "Image uploaded successfully",
        "session_id": str(result.inserted_id),
        "file_path": file_path,
        "status": "uploaded",
        "note": "OCR processing will be implemented in future phases"
    }

@router.post("/session", response_model=WritingSessionResponse)
async def create_writing_session(
    session: WritingSessionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new writing session"""
    writing_sessions_collection = get_collection("writing_sessions")
    
    session_doc = {
        "user_id": session.user_id,
        "title": session.title,
        "content": session.content,
        "language": session.language or current_user.get("learning_language", "en"),
        "status": "created",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await writing_sessions_collection.insert_one(session_doc)
    
    return WritingSessionResponse(
        id=result.inserted_id,
        user_id=session.user_id,
        title=session.title,
        content=session.content,
        language=session_doc["language"],
        created_at=session_doc["created_at"],
        updated_at=session_doc["updated_at"]
    )

@router.get("/sessions", response_model=List[WritingSessionResponse])
async def get_writing_sessions(
    skip: int = 0,
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get user's writing sessions"""
    writing_sessions_collection = get_collection("writing_sessions")
    
    # Get sessions for current user
    cursor = writing_sessions_collection.find(
        {"user_id": str(current_user["_id"])}
    ).sort("created_at", -1).skip(skip).limit(limit)
    
    sessions = await cursor.to_list(length=limit)
    
    session_list = []
    for session in sessions:
        session_list.append(WritingSessionResponse(
            id=session["_id"],
            user_id=session["user_id"],
            title=session.get("title"),
            content=session.get("content"),
            language=session.get("language"),
            created_at=session["created_at"],
            updated_at=session["updated_at"]
        ))
    
    return session_list

@router.get("/session/{session_id}", response_model=WritingSessionResponse)
async def get_writing_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific writing session"""
    writing_sessions_collection = get_collection("writing_sessions")
    
    try:
        object_id = ObjectId(session_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID format"
        )
    
    session = await writing_sessions_collection.find_one({"_id": object_id})
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Writing session not found"
        )
    
    # Check if session belongs to current user
    if session["user_id"] != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this session"
        )
    
    return WritingSessionResponse(
        id=session["_id"],
        user_id=session["user_id"],
        title=session.get("title"),
        content=session.get("content"),
        language=session.get("language"),
        created_at=session["created_at"],
        updated_at=session["updated_at"]
    )
