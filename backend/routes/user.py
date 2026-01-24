from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from models import UserResponse, PyObjectId
from routes.auth import get_current_user
from database import get_collection
from bson import ObjectId

router = APIRouter()

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get user by ID"""
    users_collection = get_collection("users")
    
    try:
        # Convert string ID to ObjectId
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Find user by ID
    user = await users_collection.find_one({"_id": object_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["_id"],
        username=user["username"],
        email=user["email"],
        full_name=user.get("full_name"),
        age=user.get("age"),
        learning_language=user.get("learning_language"),
        created_at=user["created_at"],
        is_active=user["is_active"],
        total_stars=user.get("total_stars", 0),
        last_activity=user.get("last_activity")
    )

@router.get("/", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 10, current_user: dict = Depends(get_current_user)):
    """Get list of users (for admin purposes)"""
    users_collection = get_collection("users")
    
    # Get users with pagination
    cursor = users_collection.find().skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    user_list = []
    for user in users:
        user_list.append(UserResponse(
            id=user["_id"],
            username=user["username"],
            email=user["email"],
            full_name=user.get("full_name"),
            age=user.get("age"),
            learning_language=user.get("learning_language"),
            created_at=user["created_at"],
            is_active=user["is_active"],
            total_stars=user.get("total_stars", 0),
            last_activity=user.get("last_activity")
        ))
    
    return user_list

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: dict, current_user: dict = Depends(get_current_user)):
    """Update user information"""
    users_collection = get_collection("users")
    
    try:
        object_id = ObjectId(user_id)
    except:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
    
    # Check if user exists and is the current user
    existing_user = await users_collection.find_one({"_id": object_id})
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if str(existing_user["_id"]) != str(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user"
        )
    
    # Update user (exclude sensitive fields)
    update_data = {k: v for k, v in user_update.items() 
                   if k not in ["_id", "hashed_password", "created_at"]}
    
    if update_data:
        await users_collection.update_one(
            {"_id": object_id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await users_collection.find_one({"_id": object_id})
    
    return UserResponse(
        id=updated_user["_id"],
        username=updated_user["username"],
        email=updated_user["email"],
        full_name=updated_user.get("full_name"),
        age=updated_user.get("age"),
        learning_language=updated_user.get("learning_language"),
        created_at=updated_user["created_at"],
        is_active=updated_user["is_active"],
        total_stars=updated_user.get("total_stars", 0),
        last_activity=updated_user.get("last_activity")
    )
