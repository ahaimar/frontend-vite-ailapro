export interface TestDataItem {
    questionNumber: string;
    explanation?: string;
    questionBody?: string;
    userAnswer?: string;
    correctAnswer?: string;
    scoreRaw: number;
}

export type TestModel = "Listening" | "Reading" | "Writing" | "Speaking";
export type TestCorrectionStatus = "scoring" | "completed" | "failed";

export interface TestCorrectionData {
    _id: string;
    user: string;
    testRef: string;
    testModelRef: string;
    testModel: TestModel;
    isFirstTime: boolean;
    testData: TestDataItem[];
    score: number | null;
    status: TestCorrectionStatus;
    comments?: string;
    timeSpent: number; // seconds
    startedAt: string;
    completedAt: string | null;
    accuracy?: number | null;
    weakQuestions?: string[];
    createdAt?: string;
    updatedAt?: string;
}