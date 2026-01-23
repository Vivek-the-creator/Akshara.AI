from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, user, writing, progress
from database import connect_to_mongo, close_mongo_connection
import uvicorn

app = FastAPI(title="Akshara.AI Backend", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3001", 
        "http://localhost:5173", 
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(user.router, prefix="/user", tags=["user"])
app.include_router(writing.router, prefix="/writing", tags=["writing"])
app.include_router(progress.router, prefix="/progress", tags=["progress"])

# Database connection events
app.add_event_handler("startup", connect_to_mongo)
app.add_event_handler("shutdown", close_mongo_connection)

@app.get("/")
async def root():
    return {"message": "Akshara.AI Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
