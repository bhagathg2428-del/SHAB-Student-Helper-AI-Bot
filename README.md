# SHAB — Student Helper AI Bot

SHAB is an AI-powered academic study assistant designed specifically for college students. It provides comprehensive study tutoring, document Q&A, exam-focused answers (2 marks, 5 marks, 10 marks format), note management, AI summaries, quiz generation, optical character recognition (OCR), and voice interaction.

## Architecture

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Theme**: Pure Dark/Black theme (`#050505` background, `#08080C` sidebar, `#101014` cards, `#222229` borders, subtle `#3B82F6` and `#8B5CF6` glows)
- **Backend**: Full-stack Express with Node/TypeScript in production dev server (`server.ts`) and FastAPI Python architecture in `backend/`
- **Database**: SQLite (`database/shab.db`) with user-isolated data partitioning
- **Authentication**: JWT Bearer tokens with bcrypt password hashing
- **AI Engine**: Google Gemini API (`@google/genai` with `gemini-3.8-flash`)

## API Endpoints

- `POST /api/auth/register` - Register a new student account
- `POST /api/auth/login` - Authenticate with email and password
- `POST /api/auth/logout` - Invalidate session
- `GET /api/auth/me` - Retrieve authenticated user profile
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Set new password
- `PUT /api/profile` - Update profile and password
- `GET /api/dashboard` - Real statistics (file count, quiz count, note count, recent files, activity)
- `GET /api/files` - List user files
- `POST /api/files/upload` - Upload PDF, DOCX, PPTX, TXT, images with text extraction
- `GET /api/files/:id` - Fetch file details and extracted text
- `GET /api/files/:id/download` - Download original file
- `DELETE /api/files/:id` - Delete uploaded file
- `POST /api/chat` - ChatGPT-style conversation with exam formats and document context
- `GET /api/chat/history` - Retrieve chat history
- `DELETE /api/chat/history` - Clear chat history
- `POST /api/summary` - Generate 2-mark, 5-mark, or 10-mark summaries
- `GET /api/notes` - List user notes
- `POST /api/notes` - Create new study note
- `PUT /api/notes/:id` - Update existing note
- `DELETE /api/notes/:id` - Delete study note
- `POST /api/quiz/generate` - AI multiple choice quiz generation
- `POST /api/quiz/submit` - Grade quiz and save real results
- `GET /api/quiz/history` - View past quiz results and reviews
- `POST /api/ocr` - Optical character recognition using Gemini Vision

## Environment Variables

Defined in `.env.example`:
- `GEMINI_API_KEY`: API key for Google Gemini model calls
- `SECRET_KEY`: Secret string for signing JWT tokens
- `DATABASE_URL`: Path to SQLite database file
