/**
 * DTO for an individual question result
 */
export interface TestDataDTO {
  questionNumber: string;
  explanation: string;
  questionBody: string;
  userAnswer: string;
  correctAnswer: string;
  scoreRaw: number;
}

/**
 * DTO for the full Test Correction session
 */
export interface TestCorrectionDTO {
  id: string; // Map Mongoose _id to string
  userId: string;
  testRef: string;
  testModelRef: string; // e.g., 'ListenEntity'
  testModel: 'Listening' | 'Reading' | 'Writing' | 'Speaking';
  isFirstTime: boolean;
  testData: TestDataDTO[];
  score: number | null;
  status: 'scoring' | 'completed' | 'failed';
  comments: string;
  timeSpent: number;
  startedAt: string; // Dates are serialized to ISO strings in JSON
  completedAt: string | null;
  
  // Virtuals included as they are derived properties
  accuracy: number | null;
  weakQuestions: string[];
}


export const EXAM_UI_COLORS = {
  answerCorrect: 'bg-lime-900/10 border-lime-800/40',
  answerWrong: 'bg-rose-900/10 border-rose-800/40',
  textSuccess: 'text-lime-400',
  textError: 'text-rose-400',
  textWarning: 'text-orange-500',
  badgeSuccess: 'badge badge-success',
  tabActive: 'bg-primary text-white',
  tabInactive: 'hover:bg-base-200 text-base-content/70',
} as const;