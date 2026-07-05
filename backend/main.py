import jwt
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import os
from routes.api import api_router

app = FastAPI()
app.include_router(api_router)  # Include the API router with a prefix

# Enable CORS so your React frontend can communicate with it
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Replace this with your actual Supabase JWT Secret from dashboard settings
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")
SUPABASE_ALGORITHM = os.environ.get("SUPABASE_ALGORITHM", "HS256") # Default to HS256 if not set

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to validate the Supabase JWT token passed in the Authorization header.
    """
    token = credentials.credentials
    try:
        # Decode and verify the token using your Supabase JWT Secret
        payload = jwt.decode(
            token, 
            SUPABASE_JWT_SECRET, 
            algorithms=[SUPABASE_ALGORITHM], 
            options={"verify_aud": False} # Supabase uses 'authenticated' as audience
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Token has expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authentication token"
        )

# Public Route
@app.get("/")
def read_root():
    return {"message": "Public route - Hello World"}

# Protected Route
@app.get("/protected")
def read_protected(user: dict = Depends(get_current_user)):
    """
    This endpoint is secure. 'user' contains the decoded claims 
    including user['sub'] (the Supabase User ID) and user['email'].
    """
    return {
        "message": "Success! You have accessed a protected route.",
        "user_id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("role")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)