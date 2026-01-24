import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_collection, connect_to_mongo, close_mongo_connection
from bson import ObjectId
from datetime import datetime

async def test_progress_fix():
    """Test and fix progress system issues"""
    print("🔧 Testing Progress System Fix")
    print("=" * 50)
    
    try:
        # Connect to database
        await connect_to_mongo()
        
        progress_collection = get_collection("writing_progress")
        users_collection = get_collection("users")
        
        # Check all progress records
        all_progress = await progress_collection.find({}).to_list(length=100)
        print(f"📊 Total progress records: {len(all_progress)}")
        
        # Group by user_id
        user_progress = {}
        for record in all_progress:
            user_id = record.get('user_id')
            if user_id not in user_progress:
                user_progress[user_id] = []
            user_progress[user_id].append(record)
        
        print(f"👥 Users with progress: {len(user_progress)}")
        
        # Show progress for each user
        for user_id, records in user_progress.items():
            completed = [r for r in records if r.get('completed_at')]
            total_stars = sum(r.get('stars_awarded', 0) for r in records)
            
            print(f"\n👤 User: {user_id}")
            print(f"   Total records: {len(records)}")
            print(f"   Completed levels: {len(completed)}")
            print(f"   Total stars: {total_stars}")
            
            # Show level details
            for record in sorted(records, key=lambda x: x.get('level_number', 0)):
                level = record.get('level_number')
                letter = record.get('expected_character', '?')
                stars = record.get('stars_awarded', 0)
                completed_at = record.get('completed_at')
                status = '✅' if completed_at else '⏳'
                
                print(f"   {status} Level {level}: {letter} - {stars} stars")
        
        # Test level unlocking logic
        print(f"\n🔓 Testing Level Unlocking Logic:")
        for user_id, records in user_progress.items():
            completed_levels = sorted([r.get('level_number') for r in records if r.get('completed_at')])
            
            print(f"\nUser {user_id}:")
            print(f"   Completed levels: {completed_levels}")
            
            for level in range(1, 13):
                if level == 1:
                    status = "🔓 Unlocked (First level)"
                elif level <= (completed_levels[-1] + 1 if completed_levels else 1):
                    status = "🔓 Unlocked" if level in completed_levels else "🔓 Available"
                else:
                    status = "🔒 Locked"
                
                print(f"   Level {level:2d}: {status}")
        
        print("\n✅ Progress system analysis completed!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_progress_fix())
