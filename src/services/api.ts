import { User, FileRecord, ChatMessage, Note, QuizQuestion, QuizResult, DashboardData } from '../types';

const API_BASE = 'https://shab-student-helper-ai-bot.onrender.com/api';

function getToken(): string | null {
  return localStorage.getItem('shab_token');
}

export function setToken(token: string) {
  localStorage.setItem('shab_token', token);
}

export function clearToken() {
  localStorage.removeItem('shab_token');
  localStorage.removeItem('shab_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.detail || data?.message || 'A network error occurred. Please try again.';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { full_name: string; email: string; password: string }) =>
    request<{ access_token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  logout: () =>
    request<{ detail: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () => request<User>('/auth/me'),

  forgotPassword: (email: string) =>
    request<{ detail: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (payload: { email: string; new_password: string }) =>
    request<{ detail: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateProfile: (payload: { full_name?: string; email?: string; current_password?: string; new_password?: string }) =>
    request<User>('/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard'),

  // Files
  getFiles: () => request<FileRecord[]>('/files'),

  getFile: (id: string) => request<FileRecord>(`/files/${id}`),

  uploadFiles: (files: File[]) => {
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }
    return request<FileRecord[]>('/files/upload', {
      method: 'POST',
      body: formData,
    });
  },

  deleteFile: (id: string) =>
    request<{ detail: string }>(`/files/${id}`, {
      method: 'DELETE',
    }),

  downloadFileUrl: (id: string) => `${API_BASE}/files/${id}/download`,

  // Chat
  sendMessage: (payload: { message: string; documentId?: string; language?: string }) =>
    request<ChatMessage>('/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getChatHistory: () => request<ChatMessage[]>('/chat/history'),

  clearChatHistory: () =>
    request<{ detail: string }>('/chat/history', {
      method: 'DELETE',
    }),

  // Summary
  generateSummary: (payload: {
    text?: string;
    fileId?: string;
    summaryType: string;
    answerLength: string;
    language?: string;
  }) =>
    request<{ summary: string }>('/summary', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Notes
  getNotes: () => request<Note[]>('/notes'),

  createNote: (payload: { title: string; content: string }) =>
    request<Note>('/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateNote: (id: string, payload: { title: string; content: string }) =>
    request<Note>(`/notes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteNote: (id: string) =>
    request<{ detail: string }>(`/notes/${id}`, {
      method: 'DELETE',
    }),

  // Quiz
  generateQuiz: (payload: {
    topic?: string;
    fileId?: string;
    numQuestions?: number;
    difficulty?: string;
    language?: string;
  }) =>
    request<{ quizId: string; topic: string; difficulty: string; questions: QuizQuestion[] }>('/quiz/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  submitQuiz: (payload: { quizId: string; answers: Record<string | number, string> }) =>
    request<{
      resultId: string;
      score: number;
      totalQuestions: number;
      percentage: number;
      review: any[];
    }>('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getQuizHistory: () => request<QuizResult[]>('/quiz/history'),

  // OCR
  extractOCR: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ extractedText: string }>('/ocr', {
      method: 'POST',
      body: formData,
    });
  },
};
