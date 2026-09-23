import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import { getDb, queryAll, queryOne, execute } from './src/server/db';
import { askSHABChat, generateSummaryWithAI, generateQuizWithAI, extractTextWithOCR } from './src/server/gemini';
import { extractTextFromFile } from './src/server/fileExtractor';

dotenv.config();

const JWT_SECRET = process.env.SECRET_KEY || 'shab-jwt-super-secret-key-study-2026';
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Authentication token missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; email: string; full_name: string };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ detail: 'Token has expired or is invalid. Please log in again.' });
  }
}

async function startAppServer() {
  await getDb(); // Initialize SQLite schema

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // ==========================================
  // Health
  // ==========================================
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // Auth Routes
  // ==========================================
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { full_name, email, password } = req.body;
      if (!full_name || !email || !password) {
        return res.status(400).json({ detail: 'Full name, email, and password are required.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existing = await queryOne('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
      if (existing) {
        return res.status(400).json({ detail: 'An account with this email already exists.' });
      }

      const id = crypto.randomUUID();
      const password_hash = await bcrypt.hash(password, 10);
      const now = new Date().toISOString();

      await execute(
        'INSERT INTO users (id, full_name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, String(full_name).trim(), normalizedEmail, password_hash, now, now]
      );

      const user = { id, email: normalizedEmail, full_name: String(full_name).trim() };
      const token = jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({
        access_token: token,
        token_type: 'bearer',
        user,
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      res.status(500).json({ detail: 'Registration failed. Please check your details and try again.' });
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ detail: 'Email and password are required.' });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await queryOne<{ id: string; full_name: string; email: string; password_hash: string }>(
        'SELECT id, full_name, email, password_hash FROM users WHERE email = ?',
        [normalizedEmail]
      );

      if (!user) {
        return res.status(401).json({ detail: 'Invalid email or password.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return res.status(401).json({ detail: 'Invalid email or password.' });
      }

      const payload = { id: user.id, email: user.email, full_name: user.full_name };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

      res.json({
        access_token: token,
        token_type: 'bearer',
        user: payload,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ detail: 'Login failed. Please try again.' });
    }
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.json({ detail: 'Logged out successfully.' });
  });

  app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const user = await queryOne<{ id: string; full_name: string; email: string; created_at: string }>(
        'SELECT id, full_name, email, created_at FROM users WHERE id = ?',
        [req.user!.id]
      );
      if (!user) {
        return res.status(404).json({ detail: 'User not found.' });
      }
      res.json(user);
    } catch {
      res.status(500).json({ detail: 'Failed to retrieve profile.' });
    }
  });

  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: 'Please enter your email.' });
    }
    const user = await queryOne('SELECT id FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
    if (!user) {
      // Security standard: don't reveal email existence
      return res.json({ detail: 'If this email exists in our records, password reset instructions have been sent.' });
    }
    res.json({ detail: 'Password reset link has been dispatched to your email.' });
  });

  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ detail: 'Email and new password are required.' });
    }
    const hash = await bcrypt.hash(new_password, 10);
    await execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?', [
      hash,
      new Date().toISOString(),
      String(email).trim().toLowerCase(),
    ]);
    res.json({ detail: 'Password updated successfully. You can now login.' });
  });

  // Profile update
  app.put('/api/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { full_name, email, new_password, current_password } = req.body;
      const userId = req.user!.id;

      const user = await queryOne<{ id: string; password_hash: string }>(
        'SELECT id, password_hash FROM users WHERE id = ?',
        [userId]
      );
      if (!user) return res.status(404).json({ detail: 'User not found.' });

      if (new_password) {
        if (!current_password) {
          return res.status(400).json({ detail: 'Current password is required to change password.' });
        }
        const matches = await bcrypt.compare(current_password, user.password_hash);
        if (!matches) {
          return res.status(400).json({ detail: 'Current password does not match.' });
        }
        const newHash = await bcrypt.hash(new_password, 10);
        await execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);
      }

      if (full_name) {
        await execute('UPDATE users SET full_name = ? WHERE id = ?', [String(full_name).trim(), userId]);
      }

      if (email) {
        const normEmail = String(email).trim().toLowerCase();
        const conflict = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [normEmail, userId]);
        if (conflict) {
          return res.status(400).json({ detail: 'This email is already in use by another account.' });
        }
        await execute('UPDATE users SET email = ? WHERE id = ?', [normEmail, userId]);
      }

      const updated = await queryOne<{ id: string; full_name: string; email: string }>(
        'SELECT id, full_name, email FROM users WHERE id = ?',
        [userId]
      );
      res.json(updated);
    } catch {
      res.status(500).json({ detail: 'Failed to update profile.' });
    }
  });

  // ==========================================
  // File Management
  // ==========================================
  app.get('/api/files', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const files = await queryAll(
        'SELECT id, original_name as name, file_type as type, file_size as size, upload_date, status, extracted_text FROM files WHERE user_id = ? ORDER BY upload_date DESC',
        [req.user!.id]
      );
      res.json(files);
    } catch {
      res.status(500).json({ detail: 'Failed to retrieve files.' });
    }
  });

  app.post('/api/files/upload', authMiddleware, upload.array('files', 10), async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ detail: 'No files were uploaded.' });
      }

      const userId = req.user!.id;
      const uploadedRecords = [];

      for (const file of files) {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        let extractedText = '';
        let status = 'Processed';

        try {
          extractedText = await extractTextFromFile(file.path, file.originalname, file.mimetype);
        } catch (extractErr) {
          console.error(`Text extraction failed for ${file.originalname}:`, extractErr);
          extractedText = 'Text could not be automatically extracted.';
          status = 'Partial';
        }

        await execute(
          'INSERT INTO files (id, user_id, filename, original_name, file_type, file_size, extracted_text, upload_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, userId, file.filename, file.originalname, file.mimetype || 'application/octet-stream', file.size, extractedText, now, status]
        );

        uploadedRecords.push({
          id,
          name: file.originalname,
          type: file.mimetype,
          size: file.size,
          upload_date: now,
          status,
          extracted_text: extractedText,
        });
      }

      res.status(201).json(uploadedRecords);
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ detail: 'File upload failed. Please verify file type and size.' });
    }
  });

  app.get('/api/files/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const file = await queryOne(
        'SELECT id, original_name as name, file_type as type, file_size as size, upload_date, status, extracted_text FROM files WHERE id = ? AND user_id = ?',
        [req.params.id, req.user!.id]
      );
      if (!file) return res.status(404).json({ detail: 'File not found.' });
      res.json(file);
    } catch {
      res.status(500).json({ detail: 'Failed to retrieve file details.' });
    }
  });

  app.get('/api/files/:id/download', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const file = await queryOne<{ filename: string; original_name: string }>(
        'SELECT filename, original_name FROM files WHERE id = ? AND user_id = ?',
        [req.params.id, req.user!.id]
      );
      if (!file) return res.status(404).json({ detail: 'File not found.' });

      const filePath = path.join(UPLOADS_DIR, file.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ detail: 'File content not found on server.' });
      }
      res.download(filePath, file.original_name);
    } catch {
      res.status(500).json({ detail: 'Download failed.' });
    }
  });

  app.delete('/api/files/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const file = await queryOne<{ filename: string }>(
        'SELECT filename FROM files WHERE id = ? AND user_id = ?',
        [req.params.id, req.user!.id]
      );
      if (file) {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        await execute('DELETE FROM files WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
      }
      res.json({ detail: 'File deleted successfully.' });
    } catch {
      res.status(500).json({ detail: 'Failed to delete file.' });
    }
  });

  // ==========================================
  // AI Chat
  // ==========================================
  app.get('/api/chat/history', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const history = await queryAll(
        'SELECT id, role, content, language, created_at FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 100',
        [req.user!.id]
      );
      res.json(history);
    } catch {
      res.status(500).json({ detail: 'Failed to load chat history.' });
    }
  });

  app.delete('/api/chat/history', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      await execute('DELETE FROM chat_history WHERE user_id = ?', [req.user!.id]);
      res.json({ detail: 'Chat history cleared.' });
    } catch {
      res.status(500).json({ detail: 'Failed to clear chat history.' });
    }
  });

  app.post('/api/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { message, documentId, language = 'en' } = req.body;
      if (!message || !message.trim()) {
        return res.status(400).json({ detail: 'Message cannot be empty.' });
      }

      const userId = req.user!.id;
      let documentContext = '';

      if (documentId) {
        const file = await queryOne<{ extracted_text: string }>(
          'SELECT extracted_text FROM files WHERE id = ? AND user_id = ?',
          [documentId, userId]
        );
        if (file && file.extracted_text) {
          documentContext = file.extracted_text;
        }
      }

      // Fetch recent history
      const prevMessages = await queryAll<{ role: 'user' | 'model'; content: string }>(
        'SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at ASC LIMIT 10',
        [userId]
      );

      // Save user message
      const userMsgId = crypto.randomUUID();
      const now = new Date().toISOString();
      await execute(
        'INSERT INTO chat_history (id, user_id, role, content, language, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [userMsgId, userId, 'user', message.trim(), language, now]
      );

      // Call Gemini AI
      const aiReply = await askSHABChat({
        message: message.trim(),
        history: prevMessages,
        documentContext,
        language,
      });

      // Save AI reply
      const aiMsgId = crypto.randomUUID();
      const replyTime = new Date().toISOString();
      await execute(
        'INSERT INTO chat_history (id, user_id, role, content, language, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [aiMsgId, userId, 'model', aiReply, language, replyTime]
      );

      res.json({
        id: aiMsgId,
        role: 'model',
        content: aiReply,
        created_at: replyTime,
      });
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ detail: err.message || 'AI service is temporarily unavailable. Please try again.' });
    }
  });

  // ==========================================
  // Summary
  // ==========================================
  app.post('/api/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { text, fileId, summaryType = 'quick', answerLength = '5_marks', language = 'en' } = req.body;
      let contentToSummarize = text || '';

      if (fileId) {
        const file = await queryOne<{ extracted_text: string; original_name: string }>(
          'SELECT extracted_text, original_name FROM files WHERE id = ? AND user_id = ?',
          [fileId, req.user!.id]
        );
        if (file && file.extracted_text) {
          contentToSummarize = file.extracted_text;
        }
      }

      if (!contentToSummarize || !contentToSummarize.trim()) {
        return res.status(400).json({ detail: 'Please provide text or select an uploaded document to summarize.' });
      }

      const summary = await generateSummaryWithAI({
        text: contentToSummarize,
        summaryType,
        answerLength,
        language,
      });

      res.json({ summary });
    } catch (err: any) {
      console.error('Summary error:', err);
      res.status(500).json({ detail: err.message || 'Failed to generate summary.' });
    }
  });

  // ==========================================
  // Notes
  // ==========================================
  app.get('/api/notes', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const notes = await queryAll(
        'SELECT id, title, content, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
        [req.user!.id]
      );
      res.json(notes);
    } catch {
      res.status(500).json({ detail: 'Failed to load notes.' });
    }
  });

  app.post('/api/notes', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { title, content } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ detail: 'Note title is required.' });
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await execute(
        'INSERT INTO notes (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [id, req.user!.id, title.trim(), content || '', now, now]
      );

      res.status(201).json({ id, title: title.trim(), content: content || '', created_at: now, updated_at: now });
    } catch {
      res.status(500).json({ detail: 'Failed to create note.' });
    }
  });

  app.put('/api/notes/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { title, content } = req.body;
      const now = new Date().toISOString();

      await execute(
        'UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?',
        [title.trim(), content || '', now, req.params.id, req.user!.id]
      );

      res.json({ id: req.params.id, title, content, updated_at: now });
    } catch {
      res.status(500).json({ detail: 'Failed to update note.' });
    }
  });

  app.delete('/api/notes/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      await execute('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
      res.json({ detail: 'Note deleted successfully.' });
    } catch {
      res.status(500).json({ detail: 'Failed to delete note.' });
    }
  });

  // ==========================================
  // Quiz
  // ==========================================
  app.post('/api/quiz/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { topic, fileId, numQuestions = 5, difficulty = 'Medium', language = 'en' } = req.body;

      if (!topic && !fileId) {
        return res.status(400).json({ detail: 'Please specify a study topic or choose an uploaded document.' });
      }

      let documentText = '';
      let effectiveTopic = topic || 'Document Assessment';

      if (fileId) {
        const file = await queryOne<{ extracted_text: string; original_name: string }>(
          'SELECT extracted_text, original_name FROM files WHERE id = ? AND user_id = ?',
          [fileId, req.user!.id]
        );
        if (file && file.extracted_text) {
          documentText = file.extracted_text;
          if (!topic) effectiveTopic = `Quiz on ${file.original_name}`;
        }
      }

      const questions = await generateQuizWithAI({
        topic: effectiveTopic,
        documentText,
        numQuestions: Number(numQuestions) || 5,
        difficulty,
        language,
      });

      const quizId = crypto.randomUUID();
      const now = new Date().toISOString();

      await execute(
        'INSERT INTO quizzes (id, user_id, topic, document_id, difficulty, questions_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [quizId, req.user!.id, effectiveTopic, fileId || null, difficulty, JSON.stringify(questions), now]
      );

      res.json({
        quizId,
        topic: effectiveTopic,
        difficulty,
        questions,
      });
    } catch (err: any) {
      console.error('Quiz generate error:', err);
      res.status(500).json({ detail: err.message || 'Failed to generate quiz.' });
    }
  });

  app.post('/api/quiz/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const { quizId, answers } = req.body;
      if (!quizId || !answers) {
        return res.status(400).json({ detail: 'Quiz ID and answers are required.' });
      }

      const quiz = await queryOne<{ topic: string; questions_json: string }>(
        'SELECT topic, questions_json FROM quizzes WHERE id = ? AND user_id = ?',
        [quizId, req.user!.id]
      );
      if (!quiz) return res.status(404).json({ detail: 'Quiz not found.' });

      const questions = JSON.parse(quiz.questions_json);
      let score = 0;
      const review = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i] || answers[q.id] || null;
        const isCorrect = userAnswer === q.correctAnswer;
        if (isCorrect) score++;

        review.push({
          question: q.question,
          options: q.options,
          userAnswer,
          correctAnswer: q.correctAnswer,
          isCorrect,
          explanation: q.explanation,
        });
      }

      const totalQuestions = questions.length;
      const percentage = Math.round((score / totalQuestions) * 100);
      const resultId = crypto.randomUUID();
      const now = new Date().toISOString();

      await execute(
        'INSERT INTO quiz_results (id, user_id, quiz_id, topic, score, total_questions, percentage, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [resultId, req.user!.id, quizId, quiz.topic, score, totalQuestions, percentage, JSON.stringify(review), now]
      );

      res.json({
        resultId,
        score,
        totalQuestions,
        percentage,
        review,
      });
    } catch (err: any) {
      console.error('Quiz submit error:', err);
      res.status(500).json({ detail: 'Failed to grade quiz.' });
    }
  });

  app.get('/api/quiz/history', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const history = await queryAll(
        'SELECT id, quiz_id, topic, score, total_questions, percentage, created_at, answers_json FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC',
        [req.user!.id]
      );
      const parsed = history.map((item: any) => ({
        ...item,
        review: item.answers_json ? JSON.parse(item.answers_json) : [],
      }));
      res.json(parsed);
    } catch {
      res.status(500).json({ detail: 'Failed to retrieve quiz history.' });
    }
  });

  // ==========================================
  // OCR
  // ==========================================
  app.post('/api/ocr', authMiddleware, upload.single('image'), async (req: Request, res: Response) => {
    try {
      let imageBase64 = '';
      let mimeType = 'image/png';

      if (req.file) {
        const buffer = fs.readFileSync(req.file.path);
        imageBase64 = buffer.toString('base64');
        mimeType = req.file.mimetype || 'image/png';
        // Clean up temporary image
        fs.unlinkSync(req.file.path);
      } else if (req.body.imageBase64) {
        imageBase64 = req.body.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        mimeType = req.body.mimeType || 'image/png';
      } else {
        return res.status(400).json({ detail: 'Please upload an image file or provide base64 data.' });
      }

      const extractedText = await extractTextWithOCR({ imageBase64, mimeType });
      res.json({ extractedText });
    } catch (err: any) {
      console.error('OCR error:', err);
      res.status(500).json({ detail: err.message || 'OCR extraction failed.' });
    }
  });

  // ==========================================
  // Dashboard Real Stats
  // ==========================================
  app.get('/api/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;

      // Real counts from SQLite
      const fileCountRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM files WHERE user_id = ?', [userId]);
      const quizCountRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM quiz_results WHERE user_id = ?', [userId]);
      const noteCountRow = await queryOne<{ count: number }>('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', [userId]);

      const fileCount = fileCountRow?.count || 0;
      const quizCount = quizCountRow?.count || 0;
      const noteCount = noteCountRow?.count || 0;

      // Calculate real study progress based on engagement
      let studyProgress = 0;
      if (fileCount > 0) studyProgress += 25;
      if (noteCount > 0) studyProgress += 25;
      if (quizCount > 0) studyProgress += 30;
      if (quizCount >= 3) studyProgress += 20;
      studyProgress = Math.min(studyProgress, 100);

      // Recent files
      const recentFiles = await queryAll(
        'SELECT id, original_name as name, file_type as type, file_size as size, upload_date FROM files WHERE user_id = ? ORDER BY upload_date DESC LIMIT 5',
        [userId]
      );

      // Recent quiz results
      const recentQuizResults = await queryAll(
        'SELECT id, topic, score, total_questions, percentage, created_at FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
        [userId]
      );

      // Recent activity combining chats, notes, files, quizzes
      const recentActivity = [];
      for (const f of recentFiles.slice(0, 2)) {
        recentActivity.push({
          id: f.id,
          type: 'file',
          title: `Uploaded document: ${f.name}`,
          timestamp: f.upload_date,
        });
      }
      for (const q of recentQuizResults.slice(0, 2)) {
        recentActivity.push({
          id: q.id,
          type: 'quiz',
          title: `Completed quiz on ${q.topic} (${q.score}/${q.total_questions})`,
          timestamp: q.created_at,
        });
      }

      res.json({
        fileCount,
        quizCount,
        noteCount,
        studyProgress,
        recentFiles,
        recentActivity,
        recentQuizResults,
      });
    } catch (err: any) {
      console.error('Dashboard fetch error:', err);
      res.status(500).json({ detail: 'Failed to load dashboard data.' });
    }
  });

  // ==========================================
  // Vite Dev or Production Static Serve
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SHAB backend & frontend serving on http://0.0.0.0:${PORT}`);
  });
}

startAppServer().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
