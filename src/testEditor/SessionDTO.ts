// types/session.ts
export type Module = 'Listening' | 'Reading' | 'Writing' | 'Speaking';

export interface TestData {
    questionNumber: string;
    explanation:      string;
    questionBody:   string;
    userAnswer:     string;
    correctAnswer:  string;
}

export interface CreateSessionDTO {
    isFirstTime: boolean;
    test:        string;
    testModel:   Module;
    testData:    TestData[];
    timeSpent:   number;
}

export interface ScoredTestData extends TestData {
    scoreRaw:    number;
    explanation: string;
}

export interface SessionResponse {
    _id:         string;
    user:        string;
    test:        string;
    testModel:   Module;
    testData:    ScoredTestData[];
    score?:      number;
    timeSpent:   number;
    completedAt?: string;
    createdAt?:   string;
}