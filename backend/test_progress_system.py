import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_collection, connect_to_mongo, close_mongo_connection
from bson import ObjectId
from datetime import datetime

async def test_progress_system():
    """Test the progress tracking system"""
    print("🧪 Testing Progress System")
    print("=" * 40)
    
    try:
        # Connect to database first
        await connect_to_mongo()
        
        # Get collections
        progress_collection = get_collection("writing_progress")
        users_collection = get_collection("users")
        
        if progress_collection is None:
            print("❌ Failed to get progress collection")
            return
        
        # Check existing progress
        total_progress = await progress_collection.count_documents({})
        print(f"📊 Total progress records: {total_progress}")
        
        # Get sample progress records
        cursor = progress_collection.find().limit(5)
        records = await cursor.to_list(length=5)
        
        print("\n📝 Sample Progress Records:")
        for i, record in enumerate(records, 1):
            print(f"{i}. Level {record.get('level_number')} - "
                  f"Letter: {record.get('expected_character')} - "
                  f"Stars: {record.get('stars_awarded')} - "
                  f"Completed: {'Yes' if record.get('completed_at') else 'No'}")
        
        # Check user progress for a sample user
        if records:
            sample_user_id = records[0].get('user_id')
            user_progress = await progress_collection.find({
                'user_id': sample_user_id,
                'stage': 'beginner',
                'category': 'uyir-ezhuthugal'
            }).sort('level_number', 1).to_list(length=12)
            
            print(f"\n👤 User Progress for: {sample_user_id}")
            completed_count = sum(1 for p in user_progress if p.get('completed_at'))
            total_stars = sum(p.get('stars_awarded', 0) for p in user_progress)
            
            print(f"   Completed Levels: {completed_count}/12")
            print(f"   Total Stars: {total_stars}")
            print(f"   Progress: {(completed_count/12)*100:.1f}%")
            
            # Show level unlocking status
            print("\n🔓 Level Status:")
            for level in range(1, 13):
                level_progress = next((p for p in user_progress if p.get('level_number') == level), None)
                if level == 1:
                    status = "🔓 Unlocked (First level)"
                elif level <= completed_count + 1:
                    status = "🔓 Unlocked" if level_progress and level_progress.get('completed_at') else "🔓 Available"
                else:
                    status = "🔒 Locked"
                print(f"   Level {level:2d}: {status}")
        
        print("\n✅ Progress system test completed successfully!")
        
    except Exception as e:
        print(f"❌ Error testing progress system: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Close database connection
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_progress_system())
