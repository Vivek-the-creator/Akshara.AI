import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_collection, connect_to_mongo, close_mongo_connection
from datetime import datetime

async def fix_progress_data():
    """Fix progress data to use consistent lowercase and proper user IDs"""
    print("🔧 Fixing Progress Data Consistency")
    print("=" * 50)
    
    try:
        await connect_to_mongo()
        progress_collection = get_collection("writing_progress")
        
        # Get all progress records
        all_progress = await progress_collection.find({}).to_list(length=100)
        print(f"📊 Found {len(all_progress)} progress records to check")
        
        # Fix each record
        fixed_count = 0
        for record in all_progress:
            needs_update = False
            updates = {}
            
            # Fix stage case
            if record.get('stage') and record.get('stage') != record.get('stage').lower():
                updates['stage'] = record.get('stage').lower()
                needs_update = True
                print(f"Fixing stage: {record.get('stage')} -> {record.get('stage').lower()}")
            
            # Fix category case
            if record.get('category') and record.get('category') != record.get('category').lower():
                updates['category'] = record.get('category').lower()
                needs_update = True
                print(f"Fixing category: {record.get('category')} -> {record.get('category').lower()}")
            
            # Apply updates if needed
            if needs_update:
                updates['updated_at'] = datetime.utcnow()
                await progress_collection.update_one(
                    {"_id": record["_id"]},
                    {"$set": updates}
                )
                fixed_count += 1
                print(f"✅ Fixed record for level {record.get('level_number')}")
        
        print(f"\n🎉 Fixed {fixed_count} records")
        
        # Show final state
        final_progress = await progress_collection.find({}).to_list(length=100)
        print(f"\n📋 Final Progress Records:")
        for record in sorted(final_progress, key=lambda x: (x.get('user_id'), x.get('level_number', 0))):
            user_id = record.get('user_id')
            level = record.get('level_number')
            stage = record.get('stage')
            category = record.get('category')
            completed = '✅' if record.get('completed_at') else '⏳'
            stars = record.get('stars_awarded', 0)
            
            print(f"   {completed} User: {user_id[:8]}... Level {level}: {stage}/{category} - {stars} stars")
        
        print("\n✅ Progress data fix completed!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    asyncio.run(fix_progress_data())
