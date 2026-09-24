import os
import uuid
import json
import re
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

    If Gemini is not configured, return a safe fallback
    instead of crashing the API.
    """

    if not GEMINI_API_KEY or genai is None:
        return (
            "AI service is not configured yet. "
            "Please add GEMINI_API_KEY in Render environment variables."
        )

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )

        if response and getattr(response, "text", None):
            return response.text

        return "I couldn't generate an answer right now."

    except Exception as e:
        print("Gemini error:", e)
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

    total_files = (
        db.query(FileRecord)
        .filter(FileRecord.user_id == user.id)
        .count()
    )

    quizzes_taken = (
        db.query(QuizResult)
        .filter(QuizResult.user_id == user.id)
        .count()
    )

    study_notes = (
        db.query(Note)
        .filter(Note.user_id == user.id)
        .count()
    )

    return {
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "created_at": user.created_at,
        },
        "total_files": total_files,
        "quizzes_taken": quizzes_taken,
        "study_notes": study_notes,
        "study_progress": 0,
    }


# =========================================================
# FILE TEXT EXTRACTION
# =========================================================

def extract_text_from_file(
    file_path: str,
    content_type: str,
):

    # TXT
    if (
        content_type == "text/plain"
        or file_path.lower().endswith(".txt")
    ):

        try:

            with open(
                file_path,
                "r",
                encoding="utf-8",
                errors="ignore",
            ) as f:

                return f.read()

        except Exception:

            return ""

    # PDF
    if (
        content_type == "application/pdf"
        or file_path.lower().endswith(".pdf")
    ):

        try:

            from pypdf import PdfReader

            reader = PdfReader(file_path)

            text = []

            for page in reader.pages:

                page_text = page.extract_text()

                if page_text:
                    text.append(page_text)

            return "\n".join(text)

        except Exception as e:

            print("PDF extraction error:", e)
            return ""

    return ""


# =========================================================
# FILES - GET ALL
# =========================================================

@app.get("/api/files")
def get_files(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    files = (
        db.query(FileRecord)
        .filter(FileRecord.user_id == user.id)
        .order_by(FileRecord.upload_date.desc())
        .all()
    )

    return [
        {
    "id": f.id,
    "name": f.original_name,
    "type": f.file_type,
    "size": f.file_size,
    "upload_date": f.upload_date,
    "status": f.status,
    "extracted_text": f.extracted_text or "",
}
        for f in files
    ]


# =========================================================
# FILE - GET ONE
# =========================================================

@app.get("/api/files/{file_id}")
def get_file(
    file_id: str,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    file_record = (
        db.query(FileRecord)
        .filter(
            FileRecord.id == file_id,
            FileRecord.user_id == user.id,
        )
        .first()
    )

    if not file_record:

        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    return {
        "id": file_record.id,
        "filename": file_record.original_name,
        "original_name": file_record.original_name,
        "file_type": file_record.file_type,
        "file_size": file_record.file_size,
        "upload_date": file_record.upload_date,
        "status": file_record.status,
        "extracted_text": file_record.extracted_text,
    }


# =========================================================
# FILES - UPLOAD
# =========================================================

@app.post("/api/files/upload")
async def upload_files(
    files: list[UploadFile] = File(...),
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    upload_dir = "backend/uploads"

    os.makedirs(
        upload_dir,
        exist_ok=True,
    )

    uploaded = []

    for uploaded_file in files:

        if not uploaded_file.filename:
            continue

        file_id = str(uuid.uuid4())

        original_name = uploaded_file.filename

        safe_name = re.sub(
            r"[^a-zA-Z0-9._-]",
            "_",
            original_name,
        )

        save_name = (
            f"{file_id}_{safe_name}"
        )

        file_path = os.path.join(
            upload_dir,
            save_name,
        )

        content = await uploaded_file.read()

        with open(
            file_path,
            "wb",
        ) as f:

            f.write(content)

        file_type = (
            uploaded_file.content_type
            or "application/octet-stream"
        )

        extracted_text = extract_text_from_file(
            file_path,
            file_type,
        )

        file_record = FileRecord(
            id=file_id,
            user_id=user.id,
            filename=save_name,
            original_name=original_name,
            file_type=file_type,
            file_size=len(content),
            extracted_text=extracted_text,
            status="Processed",
        )

        db.add(file_record)

        uploaded.append(
           {
    "id": file_id,
    "name": original_name,
    "type": file_type,
    "size": len(content),
    "upload_date": file_record.upload_date,
    "status": "Processed",
    "extracted_text": extracted_text or "",
}
        )

    db.commit()

    return uploaded


# =========================================================
# FILE - DOWNLOAD
# =========================================================

@app.get("/api/files/{file_id}/download")
def download_file(
    file_id: str,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    file_record = (
        db.query(FileRecord)
        .filter(
            FileRecord.id == file_id,
            FileRecord.user_id == user.id,
        )
        .first()
    )

    if not file_record:

        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    file_path = os.path.join(
        "backend/uploads",
        file_record.filename,
    )

    if not os.path.exists(file_path):

        raise HTTPException(
            status_code=404,
            detail="Physical file not found",
        )

    return FileResponse(
        path=file_path,
        filename=file_record.original_name,
        media_type=file_record.file_type,
    )


# =========================================================
# FILE - DELETE
# =========================================================

@app.delete("/api/files/{file_id}")
def delete_file(
    file_id: str,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    file_record = (
        db.query(FileRecord)
        .filter(
            FileRecord.id == file_id,
            FileRecord.user_id == user.id,
        )
        .first()
    )

    if not file_record:

        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    file_path = os.path.join(
        "backend/uploads",
        file_record.filename,
    )

    if os.path.exists(file_path):

        try:
            os.remove(file_path)
        except Exception:
            pass

    db.delete(file_record)
    db.commit()

    return {
        "detail": "File deleted successfully"
    }


# =========================================================
# CHAT
# =========================================================

@app.post("/api/chat")
def chat(
    data: ChatRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    document_text = ""

    if data.documentId:

        file_record = (
            db.query(FileRecord)
            .filter(
                FileRecord.id == data.documentId,
                FileRecord.user_id == user.id,
            )
            .first()
        )

        if file_record:

            document_text = (
                file_record.extracted_text
                or ""
            )

    # Save user message
    user_message = ChatMessage(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role="user",
        content=data.message,
        language=data.language or "en",
    )

    db.add(user_message)
    db.commit()

    prompt = f"""
You are SHAB, a Student Helper AI Bot.

Act as an exam tutor.

Give clear, student-friendly answers.

Use:
- headings
- numbered lists
- bullet points
- examples when useful
- important points
- key takeaways

Student language: {data.language or "en"}

Student question:
{data.message}

Document context:
{document_text[:12000]}
"""

    answer = generate_ai_response(prompt)

    assistant_message = ChatMessage(
        id=str(uuid.uuid4()),
        user_id=user.id,
        role="assistant",
        content=answer,
        language=data.language or "en",
    )

    db.add(assistant_message)
    db.commit()

    return {
        "id": assistant_message.id,
        "role": "assistant",
        "content": answer,
        "language": data.language or "en",
        "created_at": assistant_message.created_at,
    }


# =========================================================
# CHAT HISTORY
# =========================================================

@app.get("/api/chat/history")
def get_chat_history(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    messages = (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user.id
        )
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    return [
        {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "language": message.language,
            "created_at": message.created_at,
        }
        for message in messages
    ]


# =========================================================
# CLEAR CHAT HISTORY
# =========================================================

@app.delete("/api/chat/history")
def clear_chat_history(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    (
        db.query(ChatMessage)
        .filter(
            ChatMessage.user_id == user.id
        )
        .delete(
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "detail": "Chat history cleared successfully"
    }


# =========================================================
# SUMMARY
# =========================================================

@app.post("/api/summary")
def generate_summary(
    data: SummaryRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    text = data.text or ""

    if data.fileId:

        file_record = (
            db.query(FileRecord)
            .filter(
                FileRecord.id == data.fileId,
                FileRecord.user_id == user.id,
            )
            .first()
        )

        if not file_record:

            raise HTTPException(
                status_code=404,
                detail="File not found",
            )

        text = (
            file_record.extracted_text
            or ""
        )

    if not text.strip():

        raise HTTPException(
            status_code=400,
            detail="No text or document content available",
        )

    prompt = f"""
You are SHAB, an exam-focused study assistant.

Create a useful summary for a college student.

Summary type:
{data.summaryType}

Answer length:
{data.answerLength}

Language:
{data.language}

Use headings, bullet points and important exam points.

Text:
{text[:20000]}
"""

    summary = generate_ai_response(prompt)

    return {
        "summary": summary
    }


# =========================================================
# NOTES - GET
# =========================================================

@app.get("/api/notes")
def get_notes(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    notes = (
        db.query(Note)
        .filter(Note.user_id == user.id)
        .order_by(Note.updated_at.desc())
        .all()
    )

    return [
        {
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at,
            "updated_at": note.updated_at,
        }
        for note in notes
    ]


# =========================================================
# NOTES - CREATE
# =========================================================

@app.post("/api/notes")
def create_note(
    data: NoteCreate,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    note = Note(
        id=str(uuid.uuid4()),
        user_id=user.id,
        title=data.title,
        content=data.content or "",
    )

    db.add(note)
    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


# =========================================================
# NOTES - UPDATE
# =========================================================

@app.put("/api/notes/{note_id}")
def update_note(
    note_id: str,
    data: NoteUpdate,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == user.id,
        )
        .first()
    )

    if not note:

        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    if data.title is not None:
        note.title = data.title

    if data.content is not None:
        note.content = data.content

    note.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(note)

    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "updated_at": note.updated_at,
    }


# =========================================================
# NOTES - DELETE
# =========================================================

@app.delete("/api/notes/{note_id}")
def delete_note(
    note_id: str,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    note = (
        db.query(Note)
        .filter(
            Note.id == note_id,
            Note.user_id == user.id,
        )
        .first()
    )

    if not note:

        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    db.delete(note)
    db.commit()

    return {
        "detail": "Note deleted successfully"
    }


# =========================================================
# QUIZ GENERATION
# =========================================================

@app.post("/api/quiz/generate")
def generate_quiz(
    data: QuizGenerateRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    topic = data.topic or "General"

    document_text = ""

    if data.fileId:

        file_record = (
            db.query(FileRecord)
            .filter(
                FileRecord.id == data.fileId,
                FileRecord.user_id == user.id,
            )
            .first()
        )

        if not file_record:

            raise HTTPException(
                status_code=404,
                detail="File not found",
            )

        document_text = (
            file_record.extracted_text
            or ""
        )

    num_questions = max(
        1,
        min(
            data.numQuestions or 5,
            20,
        ),
    )

    prompt = f"""
Create a multiple-choice quiz for a college student.

Topic:
{topic}

Number of questions:
{num_questions}

Difficulty:
{data.difficulty}

Language:
{data.language}

Document content:
{document_text[:15000]}

Return ONLY valid JSON.

Format:

{{
  "questions": [
    {{
      "id": "q1",
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "correctAnswer": "Option A"
    }}
  ]
}}
"""

    ai_text = generate_ai_response(prompt)

    questions = []

    try:

        cleaned = ai_text.strip()

        cleaned = re.sub(
            r"^```json\s*",
            "",
            cleaned,
        )

        cleaned = re.sub(
            r"\s*```$",
            "",
            cleaned,
        )

        parsed = json.loads(cleaned)

        questions = parsed.get(
            "questions",
            [],
        )

    except Exception as e:

        print("Quiz JSON error:", e)

    # Fallback quiz
    if not questions:

        questions = [
            {
                "id": f"q{i + 1}",
                "question": f"Question {i + 1} about {topic}",
                "options": [
                    "Option A",
                    "Option B",
                    "Option C",
                    "Option D",
                ],
                "correctAnswer": "Option A",
            }
            for i in range(num_questions)
        ]

    quiz_id = str(uuid.uuid4())

    quiz = Quiz(
        id=quiz_id,
        user_id=user.id,
        topic=topic,
        document_id=data.fileId,
        difficulty=data.difficulty or "Medium",
        questions_json=json.dumps(
            questions
        ),
    )

    db.add(quiz)
    db.commit()

    # Do not expose correct answers to frontend
    public_questions = []

    for q in questions:

        public_questions.append(
            {
                "id": q.get(
                    "id",
                    str(uuid.uuid4()),
                ),
                "question": q.get(
                    "question",
                    "",
                ),
                "options": q.get(
                    "options",
                    [],
                ),
            }
        )

    return {
        "quizId": quiz_id,
        "topic": topic,
        "difficulty": data.difficulty or "Medium",
        "questions": public_questions,
    }


# =========================================================
# QUIZ SUBMIT
# =========================================================

@app.post("/api/quiz/submit")
def submit_quiz(
    data: QuizSubmitRequest,
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    quiz = (
        db.query(Quiz)
        .filter(
            Quiz.id == data.quizId,
            Quiz.user_id == user.id,
        )
        .first()
    )

    if not quiz:

        raise HTTPException(
            status_code=404,
            detail="Quiz not found",
        )

    try:

        questions = json.loads(
            quiz.questions_json
        )

    except Exception:

        raise HTTPException(
            status_code=500,
            detail="Invalid quiz data",
        )

    score = 0
    review = []

    for index, question in enumerate(
        questions
    ):

        question_id = str(
            question.get(
                "id",
                index,
            )
        )

        correct_answer = question.get(
            "correctAnswer",
            "",
        )

        submitted_answer = data.answers.get(
            question_id
        )

        if submitted_answer is None:

            submitted_answer = data.answers.get(
                str(index)
            )

        is_correct = (
            submitted_answer == correct_answer
        )

        if is_correct:
            score += 1

        review.append(
            {
                "id": question_id,
                "question": question.get(
                    "question",
                    "",
                ),
                "yourAnswer": submitted_answer,
                "correctAnswer": correct_answer,
                "correct": is_correct,
            }
        )

    total_questions = len(questions)

    percentage = (
        (score / total_questions) * 100
        if total_questions
        else 0
    )

    result_id = str(uuid.uuid4())

    result = QuizResult(
        id=result_id,
        user_id=user.id,
        quiz_id=quiz.id,
        topic=quiz.topic,
        score=score,
        total_questions=total_questions,
        percentage=percentage,
        answers_json=json.dumps(
            data.answers
        ),
    )

    db.add(result)
    db.commit()

    return {
        "resultId": result_id,
        "score": score,
        "totalQuestions": total_questions,
        "percentage": percentage,
        "review": review,
    }


# =========================================================
# QUIZ HISTORY
# =========================================================

@app.get("/api/quiz/history")
def quiz_history(
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    user = get_authenticated_user(
        authorization,
        db,
    )

    results = (
        db.query(QuizResult)
        .filter(
            QuizResult.user_id == user.id
        )
        .order_by(
            QuizResult.created_at.desc()
        )
        .all()
    )

    return [
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
        for result in results
    ]


# =========================================================
# OCR
# =========================================================

@app.post("/api/ocr")
async def extract_ocr(
    image: UploadFile = File(...),
    authorization: str = Header(default=""),
    db: Session = Depends(get_db),
):

    # Verify login
    get_authenticated_user(
        authorization,
        db,
    )

    image_bytes = await image.read()

    # Try pytesseract if available
    try:

        from PIL import Image
        import pytesseract
        import io

        img = Image.open(
            io.BytesIO(image_bytes)
        )

        extracted_text = pytesseract.image_to_string(
            img
        )

        return {
            "extractedText": extracted_text
        }

    except Exception as e:

        print("OCR error:", e)

        return {
            "extractedText": "",
            "message": (
                "OCR engine is not available "
                "on the server."
            ),
        }


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():

    return {
        "message": "SHAB Student Helper AI Bot API is running",
        "docs": "/docs",
        "health": "/api/health",
    }


# =========================================================
# RUN LOCALLY
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
