export interface User {
  id: string;
  full_name: string;
  email: string;
  created_at?: string;
}

export interface FileRecord {
  id: string;
  name: string;
  type: string;
  size: number;
  upload_date: string;
  status: string;
  extracted_text?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  language?: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface QuizReviewItem {
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  userAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface QuizResult {
  id: string;
  quiz_id?: string;
  topic: string;
  score: number;
  total_questions: number;
  percentage: number;
  created_at: string;
  review?: QuizReviewItem[];
}

export interface DashboardData {
  fileCount: number;
  quizCount: number;
  noteCount: number;
  studyProgress: number;
  recentFiles: FileRecord[];
  recentActivity: {
    id: string;
    type: 'file' | 'quiz' | 'note';
    title: string;
    timestamp: string;
  }[];
  recentQuizResults: QuizResult[];
}

export type SupportedLanguage = 'en' | 'te' | 'hi';
