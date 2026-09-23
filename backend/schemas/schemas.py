from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any

class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    created_at: Any

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserOut

class ChatRequest(BaseModel):
    message: str
    documentId: Optional[str] = None
    language: Optional[str] = "en"

class SummaryRequest(BaseModel):
    text: Optional[str] = None
    fileId: Optional[str] = None
    summaryType: Optional[str] = "quick"
    answerLength: Optional[str] = "5_marks"
    language: Optional[str] = "en"

class NoteCreate(BaseModel):
    title: str
    content: Optional[str] = ""

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    topic: Optional[str] = None
    fileId: Optional[str] = None
    numQuestions: Optional[int] = 5
    difficulty: Optional[str] = "Medium"
    language: Optional[str] = "en"

class QuizSubmitRequest(BaseModel):
    quizId: str
    answers: Dict[str, Any]
