

export const Module = {
  Listening: "listening",
  Reading: "reading",
  Writing: "writing",
  Speaking: "speaking"
} as const;

export interface Question {
  questionTitle: string;
  module: string;
  questionType: string;
  instruction: string;
  content: string;
  correctAnswer: string;
  explanation: string;
  tags: string;
  possibleAnswers: string[];
  falseAnswers: string[];
  options: OptionRow[];
}

export interface OptionRow {
  id: number;
  text: string;
  isCorrect: boolean;
}

export interface Section {
  duration: number;
  passage?: string;
  audioUrl?: string;
  questions: Question[];
}

export interface TestDetails{
    testTitle: string;
    testBody: string;
    displayType: string;
    testType: TEST_TYPES;
    isActive: boolean;
    marks: number;
    createdBy: string;
    questions: Question[];
}

type TEST_TYPES = "academic" | "general" | "both";

export const MODULES = ["listening", "reading", "writing", "speaking"];

export const TEST_TYPES = ["academic", "general", "both"];

export const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"] as const;
