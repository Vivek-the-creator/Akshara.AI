from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from bson import ObjectId

class VoicePracticeContent(BaseModel):
    """Voice practice content model"""
    id: Optional[str] = None
    level: str  # "beginner", "intermediate", "advanced"
    tamil_text: str
    english_translation: str
    romanization: str  # How to pronounce in English letters
    audio_url: Optional[str] = None  # Pre-recorded audio file URL
    difficulty_score: float = Field(default=1.0, ge=1.0, le=10.0)
    
class VoicePracticeAttempt(BaseModel):
    """User's voice practice attempt"""
    user_id: str
    content_id: str
    level: str
    spoken_text: str
    confidence_score: float  # 0-100
    pronunciation_accuracy: float  # 0-100
    timestamp: datetime
    completed: bool = False
    best_score: float = 0.0

class VoicePracticeProgress(BaseModel):
    """User's overall progress in voice practice"""
    user_id: str
    level: str
    total_items: int
    completed_items: int
    best_scores: Dict[str, float]  # content_id -> best_score
    level_unlocked: bool = False
    level_completed: bool = False
    completion_percentage: float = 0.0
    last_attempt: Optional[datetime] = None
    
class VoicePracticeLevel(BaseModel):
    """Level configuration"""
    level_name: str
    display_name: str
    description: str
    unlock_threshold: float  # Score needed to unlock next level
    completion_threshold: float  # Score needed to mark level complete
    required_accuracy: float  # Minimum accuracy for completion
    items: List[VoicePracticeContent]
