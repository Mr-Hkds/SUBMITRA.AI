export enum QuestionType {
  SHORT_ANSWER = 'SHORT_ANSWER',
  PARAGRAPH = 'PARAGRAPH',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE', // Radio
  CHECKBOXES = 'CHECKBOXES',
  DROPDOWN = 'DROPDOWN',
  LINEAR_SCALE = 'LINEAR_SCALE',
  DATE = 'DATE',
  TIME = 'TIME',
  GRID = 'GRID', // Added for parsing robustness
  UNKNOWN = 'UNKNOWN'
}

export interface FormOption {
  value: string;
  weight?: number; // 0-100
}

export interface FormQuestion {
  id: string;
  title: string;
  type: QuestionType;
  options: FormOption[];
  required: boolean;
  // For text inputs, AI can suggest realistic random answers
  aiTextSuggestions?: string[];
}

export interface FormAnalysis {
  title: string;
  description: string;
  questions: FormQuestion[];
  aiReasoning: string;
}

export interface ScriptConfig {
  targetCount: number;
  delayMin: number;
  delayMax: number;
  names?: string[]; // Added for Gold Edition logic
  nameSource?: 'auto' | 'indian' | 'custom';
  customFieldResponses?: Record<string, string[]>; // Map question ID to array of custom answers
}

export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isPremium: boolean;
  isAdmin?: boolean; // Admin Flag
  responsesUsed: number;
  // Timestamps
  createdAt: any;
  lastLogin: any;
  tokens: number;
}

export interface PaymentRequest {
  id: string; // Document ID
  userId: string;
  userEmail: string;
  amount: number;
  utr: string; // Transaction ID
  tokens: number; // Added for token based system
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  processedAt?: any;
}