import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_collection, connect_to_mongo, close_mongo_connection

async def test_complete_system():
    """Test the complete progress system end-to-end"""
    print("🧪 Testing Complete Progress System")
    print("=" * 50)
    
    try:
        await connect_to_mongo()
        progress_collection = get_collection("writing_progress")
        users_collection = get_collection("users")
        
        # Test user ID (this should match your actual user)
        test_user_id = "6973a551540cb9abc5e922eb"
        
        print(f"👤 Testing for user: {test_user_id}")
        
        # 1. Test getting all progress for user
        print("\n1️⃣ Testing GET /progress/user")
        user_progress = await progress_collection.find({
            "user_id": test_user_id,
            "stage": "beginner",
            "category": "uyir-ezhuthugal"
        }).sort("level_number", 1).to_list(length=12)
        
        print(f"   Found {len(user_progress)} progress records")
        for record in user_progress:
            level = record.get('level_number')
            letter = record.get('expected_character')
            completed = record.get('completed_at')
            stars = record.get('stars_awarded', 0)
            status = '✅ COMPLETED' if completed else '⏳ IN PROGRESS'
            print(f"   Level {level}: {letter} - {status} - {stars} stars")
        
        # 2. Test level unlocking logic
        print("\n2️⃣ Testing Level Unlocking Logic")
        completed_levels = [r.get('level_number') for r in user_progress if r.get('completed_at')]
        print(f"   Completed levels: {completed_levels}")
        
        for level in range(1, 13):
            if level == 1:
                status = "🔓 Unlocked (First level)"
            elif level <= (max(completed_levels) + 1 if completed_levels else 1):
                status = "🔓 Unlocked" if level in completed_levels else "🔓 Available"
            else:
                status = "🔒 Locked"
            print(f"   Level {level:2d}: {status}")
        
        # 3. Test progress calculation
        print("\n3️⃣ Testing Progress Calculation")
        total_levels = 12
        completed_count = len(completed_levels)
        progress_percentage = (completed_count / total_levels) * 100
        total_stars = sum(r.get('stars_awarded', 0) for r in user_progress)
        max_stars = total_levels * 3
        stars_percentage = (total_stars / max_stars) * 100
        
        print(f"   Levels: {completed_count}/{total_levels} ({progress_percentage:.1f}%)")
        print(f"   Stars: {total_stars}/{max_stars} ({stars_percentage:.1f}%)")
        
        # 4. Test specific level queries
        print("\n4️⃣ Testing Level-Specific Queries")
        for level in [1, 2, 3, 4]:
            level_record = await progress_collection.find_one({
                "user_id": test_user_id,
                "stage": "beginner",
                "category": "uyir-ezhuthugal",
                "level_number": level
            })
            
            if level_record:
                completed = "✅ Yes" if level_record.get('completed_at') else "⏳ No"
                stars = level_record.get('stars_awarded', 0)
                attempts = level_record.get('attempts_count', 0)
                print(f"   Level {level}: Found - Completed: {completed}, Stars: {stars}, Attempts: {attempts}")
            else:
                print(f"   Level {level}: Not found")
        
        print("\n✅ Complete system test finished!")
        print("📝 Expected Frontend Behavior:")
        print(f"   - Progress bars should show {progress_percentage:.1f}% completion")
        print(f"   - Levels 1-{max(completed_levels) + 1 if completed_levels else 1} should be unlocked")
        print(f"   - Total stars should be {total_stars}")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(test_complete_system())
