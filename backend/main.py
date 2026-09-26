import os
import uuid
import json
import re
import time
from datetime import datetime, timedelta, timezone

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Header,
    UploadFile,
    File,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from backend.database.database import engine, Base, SessionLocal
from backend.models.models import (
    User,
    FileRecord,
    ChatMessage,
    Note,
    Quiz,
    QuizResult,
)
from backend.schemas.schemas import (
    UserRegister,
    UserLogin,
    ChatRequest,
    SummaryRequest,
    NoteCreate,
    NoteUpdate,
    QuizGenerateRequest,
    QuizSubmitRequest,
)


# =========================================================
# DATABASE
# =========================================================

Base.metadata.create_all(bind=engine)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="SHAB — Student Helper AI Bot API",
    description="Backend API for SHAB College AI Study Assistant",
    version="2.0.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# SECURITY
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "SHAB-development-secret-change-this"
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto",
)


# =========================================================
# GEMINI
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

try:
    from google import genai
except Exception:
    genai = None


def generate_ai_response(prompt: str) -> str:
    """
    Generate an answer using Gemini.
    Automatically retries temporary Gemini errors.
    """

    if not GEMINI_API_KEY or genai is None:
        return (
            "AI service is not configured yet. "
            "Please add GEMINI_API_KEY in Render environment variables."
        )

    client = genai.Client(api_key=GEMINI_API_KEY)

    max_retries = 3

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-3.6-flash",
                contents=prompt,
            )

            if response and response.text:
                return response.text

            return "Gemini returned an empty response."

        except Exception as e:
            error_text = str(e)
            error_code = getattr(e, "code", None)

            # Retry temporary Gemini errors
            if error_code in (429, 500, 503, 504) or any(
                code in error_text
                for code in ["429", "500", "503", "504"]
            ):
                if attempt < max_retries - 1:
                    delay = 2 ** attempt
                    print(
                        f"Gemini temporary error. "
                        f"Retrying in {delay} seconds..."
                    )
                    time.sleep(delay)
                    continue

            print(f"Gemini error: {e}")
            return "AI service is temporarily unavailable."

    return "AI service is temporarily unavailable."


# =========================================================
# DATABASE DEPENDENCY
# =========================================================

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


# =========================================================
# JWT
# =========================================================

def create_access_token(user_id: str):

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expire,
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_authenticated_user(
    authorization: str,
    db: Session,
):

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    token = authorization.replace("Bearer ", "").strip()

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token",
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


# =========================================================
# HEALTH
# =========================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "ok",
        "app": "SHAB",
        "version": "2.0.0",
    }


# =========================================================
# AUTH - REGISTER
# =========================================================

@app.post("/api/auth/register")
def register(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):

    existing_user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    user = User(
        id=str(uuid.uuid4()),
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=pwd_context.hash(
            user_data.password
        ),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at,
        },
    }


# =========================================================
# AUTH - LOGIN
# =========================================================

@app.post("/api/auth/login")
def login(
    user_data: UserLogin,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(User.email == user_data.email)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    if not pwd_context.verify(
        user_data.password,
        user.password_hash,
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at,
        },
    }


# =========================================================
# AUTH - LOGOUT
# =========================================================

@app.post("/api/auth/logout")
def logout():

    return {
        "detail": "Logged out successfully"
    }


# =========================================================
# AUTH - ME
# =========================================================

@app.get("/api/auth/me")
def get_current_user(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "created_at": user.created_at,
    }


# =========================================================
# FORGOT PASSWORD
# =========================================================

@app.post("/api/auth/forgot-password")
def forgot_password(
    data: dict,
    db: Session = Depends(get_db),
):

    email = data.get("email")

    if not email:

        raise HTTPException(
            status_code=400,
            detail="Email is required",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    # Do not reveal whether account exists
    return {
        "detail": (
            "If an account exists with this email, "
            "you can reset the password."
        )
    }


# =========================================================
# RESET PASSWORD
# =========================================================

@app.post("/api/auth/reset-password")
def reset_password(
    data: dict,
    db: Session = Depends(get_db),
):

    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:

        raise HTTPException(
            status_code=400,
            detail="Email and new password are required",
        )

    user = (
        db.query(User)
        .filter(User.email == email)
        .first()
    )

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    user.password_hash = pwd_context.hash(
        new_password
    )

    db.commit()

    return {
        "detail": "Password reset successfully"
    }


# =========================================================
# PROFILE
# =========================================================

@app.put("/api/profile")
def update_profile(
    data: dict,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    if data.get("full_name"):
        user.full_name = data["full_name"]

    if data.get("email"):

        existing = (
            db.query(User)
            .filter(
                User.email == data["email"],
                User.id != user.id,
            )
            .first()
        )

        if existing:

            raise HTTPException(
                status_code=400,
                detail="Email already registered",
            )

        user.email = data["email"]

    if data.get("new_password"):

        current_password = data.get(
            "current_password"
        )

        if not current_password:

            raise HTTPException(
                status_code=400,
                detail="Current password is required",
            )

        if not pwd_context.verify(
            current_password,
            user.password_hash,
        ):

            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect",
            )

        user.password_hash = pwd_context.hash(
            data["new_password"]
        )

    user.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "created_at": user.created_at,
    }


# =========================================================
# DASHBOARD
# =========================================================

@app.get("/api/dashboard")
def get_dashboard(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    # =====================================================
    # FILES
    # =====================================================

    files = (
        db.query(FileRecord)
        .filter(FileRecord.user_id == user.id)
        .order_by(FileRecord.upload_date.desc())
        .all()
    )

    file_count = len(files)

    recent_files = [
        {
            "id": file.id,
            "name": file.original_name,
            "type": file.file_type,
            "size": file.file_size,
            "upload_date": file.upload_date,
            "status": file.status,
        }
        for file in files[:5]
    ]

    # =====================================================
    # NOTES
    # =====================================================

    note_count = (
        db.query(Note)
        .filter(Note.user_id == user.id)
        .count()
    )

    # =====================================================
    # QUIZ RESULTS
    # =====================================================

    quiz_results = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == user.id)
        .order_by(QuizResult.created_at.desc())
        .all()
    )

    quiz_count = len(quiz_results)

    recent_quiz_results = [
        {
            "id": result.id,
            "resultId": result.id,
            "quizId": result.quiz_id,
            "topic": result.topic,
            "score": result.score,
            "totalQuestions": result.total_questions,
            "percentage": result.percentage,
            "created_at": result.created_at,
        }
        for result in quiz_results[:5]
    ]

    # =====================================================
    # STUDY PROGRESS
    # =====================================================

    progress = 0

    if file_count > 0:
        progress += 40

    if note_count > 0:
        progress += 20

    if quiz_count > 0:
        progress += 40

    progress = min(progress, 100)

    # =====================================================
    # RECENT ACTIVITY
    # =====================================================

    recent_activity = []

    for file in files[:3]:

        recent_activity.append(
            {
                "id": f"file-{file.id}",
                "type": "file",
                "title": f"Uploaded {file.original_name}",
                "created_at": file.upload_date,
            }
        )

    for result in quiz_results[:3]:

        recent_activity.append(
            {
                "id": f"quiz-{result.id}",
                "type": "quiz",
                "title": f"Completed quiz: {result.topic}",
                "created_at": result.created_at,
            }
        )

    recent_activity.sort(
        key=lambda x: x["created_at"],
        reverse=True,
    )

    # =====================================================
    # RETURN DASHBOARD DATA
    # =====================================================

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at,
        },

        "fileCount": file_count,

        "quizCount": quiz_count,

        "noteCount": note_count,

        "studyProgress": progress,

        "recentFiles": recent_files,

        "recentQuizResults": recent_quiz_results,

        "recentActivity": recent_activity[:6],
    }


# =========================================================
# FILE TEXT EXTRACTION
# =========================================================
