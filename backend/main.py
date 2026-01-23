from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, user, writing
from database import connect_to_mongo, close_mongo_connection
import uvicorn

# Import routes individually to handle errors
try:
    from routes import auth
    print("✅ Auth routes imported successfully")
except Exception as e:
    print(f"❌ Error importing auth routes: {e}")

try:
    from routes import user
    print("✅ User routes imported successfully")
except Exception as e:
    print(f"❌ Error importing user routes: {e}")

try:
    from routes import writing
    print("✅ Writing routes imported successfully")
except Exception as e:
    print(f"❌ Error importing writing routes: {e}")

try:
    from routes import voice_practice_simple
    print("✅ Voice practice routes imported successfully")
except Exception as e:
    print(f"❌ Error importing voice practice routes: {e}")

app = FastAPI(title="AI Language Learning Platform", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection events
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(writing.router, prefix="/writing", tags=["writing"])

@app.get("/")
async def root():
    return {"message": "AI Language Learning Platform API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
