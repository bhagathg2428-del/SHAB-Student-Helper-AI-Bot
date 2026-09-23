import os
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Depends, HTTPException,Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from passlib.context import CryptContext

from backend.database.database import engine, Base, SessionLocal
from backend.models.models import Note
from backend.schemas.schemas import UserRegister, UserLogin, UserOut


# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SHAB — Student Helper AI Bot API",
    description="Backend API for SHAB College AI Study Assistant",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security
SECRET_KEY = os.getenv("SECRET_KEY", "SHAB-development-secret-change-this")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Create JWT token
def create_access_token(user_id: str):
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "sub": user_id,
        "exp": expire
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# Health check
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app": "SHAB",
        "version": "1.0.0"
    }


# REGISTER
@app.post("/api/auth/register")
def register(user_data: UserRegister, db: Session = Depends(get_db)):

    existing_user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_password = pwd_context.hash(user_data.password)

    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        password_hash=hashed_password
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
            "created_at": user.created_at
        }
    }


# LOGIN
@app.post("/api/auth/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):

    user = db.query(User).filter(
        User.email == user_data.email
    ).first()

    if not user or not pwd_context.verify(
        user_data.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at
        }
    }


# LOGOUT
@app.post("/api/auth/logout")
def logout():
    return {
        "message": "Logged out successfully"
    }


# CURRENT USER
@app.get("/api/auth/me")
def get_current_user(
    authorization: str = "",
    db: Session = Depends(get_db)
):

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "created_at": user.created_at
    }


# DASHBOARD
@app.get("/api/dashboard")
def get_dashboard(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at
        },
        "total_files": 0,
        "quizzes_taken": 0,
        "study_notes": 0,
        "study_progress": 0
    }

# PROFILE + NOTES API
from backend.models.models import Note


def get_authenticated_user(
    authorization: str,
    db: Session
):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Not authenticated"
        )

    token = authorization.replace("Bearer ", "")

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user


# UPDATE PROFILE
@app.put("/api/profile")
def update_profile(
    data: dict,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    user = get_authenticated_user(authorization, db)

    if data.get("full_name"):
        user.full_name = data["full_name"]

    if data.get("email"):
        existing = db.query(User).filter(
            User.email == data["email"],
            User.id != user.id
        ).first()

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        user.email = data["email"]

    if data.get("new_password"):
        current_password = data.get("current_password")

        if not current_password:
            raise HTTPException(
                status_code=400,
                detail="Current password is required"
            )

        if not pwd_context.verify(
            current_password,
            user.password_hash
        ):
            raise HTTPException(
                status_code=400,
                detail="Current password is incorrect"
            )

        user.password_hash = pwd_context.hash(
            data["new_password"]
        )

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "created_at": user.created_at
    }


# GET NOTES
@app.get("/api/notes")
def get_notes(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    user = get_authenticated_user(authorization, db)

    notes = db.query(Note).filter(
        Note.user_id == user.id
    ).order_by(
        Note.updated_at.desc()
    ).all()

    return [
        {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at,
            "updated_at": note.updated_at
        }
        for note in notes
    ]


# CREATE NOTE
@app.post("/api/notes")
def create_note(
    data: dict,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    user = get_authenticated_user(authorization, db)

    note = Note(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=data.get("title", "Untitled"),
        content=data.get("content", "")
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at
    }


# UPDATE NOTE
@app.put("/api/notes/{note_id}")
def update_note(
    note_id: str,
    data: dict,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    user = get_authenticated_user(authorization, db)

    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    note.title = data.get("title", note.title)
    note.content = data.get("content", note.content)
    note.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at
    }


# DELETE NOTE
@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: str,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db)
):
    user = get_authenticated_user(authorization, db)

    note = db.query(Note).filter(
        Note.id == note_id,
        Note.user_id == user.id
    ).first()

    if not note:
        raise HTTPException(
            status_code=404,
            detail="Note not found"
        )

    db.delete(note)
    db.commit()

    return {
        "detail": "Note deleted successfully"
    }
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
