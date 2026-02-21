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
  entryId: string;
  title: string;
  type: QuestionType;
  options: FormOption[];
  required: boolean;
  pageIndex?: number; // 0-indexed section/page number
  // For text inputs, AI can suggest realistic random answers
  aiTextSuggestions?: string[];
}

export interface FormAnalysis {
  title: string;
  description: string;
  questions: FormQuestion[];
  aiReasoning: string;
  hiddenFields?: Record<string, string>; // Added for submitting hidden inputs like fbzx
  targetCount?: number; // Added to persist target count through analysis
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

export interface TokenRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  requestedAmount: number; // max 200
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  processedAt?: any;
}

