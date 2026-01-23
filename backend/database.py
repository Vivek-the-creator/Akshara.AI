from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "language_learning_db")

client = None
database = None

async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000
        )

        # Test the connection
        await client.admin.command('ping')
        database = client[DATABASE_NAME]
        print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
        
        # Create indexes for better performance
        await create_indexes()
        
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✅ MongoDB connection closed")

async def create_indexes():
    """Create database indexes"""
    try:
        # Create unique index on email for users collection
        await database.users.create_index("email", unique=True)
        print("✅ Database indexes created")
    except Exception as e:
        print(f"⚠️ Warning: Could not create indexes: {e}")

def get_database():
    """Get database instance"""
    return database

def get_collection(collection_name: str):
    """Get a specific collection"""
    return database[collection_name] if database is not None else None
