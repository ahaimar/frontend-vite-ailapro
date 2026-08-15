
export function apiMessage(err: unknown, fallback: string): string {
    const data = (err as { response?: { data?: { message?: string; error?: string; details?: string[] } } })
        ?.response?.data;

    const base = data?.message ?? data?.error ?? (err as Error)?.message ?? fallback;
    const details = data?.details?.length ? `: ${data.details.join('; ')}` : '';

    return base + details;
}

export const MET_TYPE = ['mock', 'exam', 'model'] as const;
export type WriteTestType= typeof MET_TYPE[number];

// Map localized difficulty colors for quick user scanning anchors
export const DIFFICULTY_CLASSES: Record<string, string> = {
    Easy: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
    Medium: "bg-amber-900/40 border-amber-700/50 text-amber-300",
    Hard: "bg-rose-900/40 border-rose-700/50 text-rose-300",
    Mixed: "bg-cyan-900/40 border-cyan-700/50 text-cyan-300",
};


export const STATUSES = ['draft', 'published', 'archived'] as const;
export type Status = typeof STATUSES[number];

export const LEVELS = ['Easy', 'Medium', 'Hard', 'Mixed'] as const;

export type Level = typeof LEVELS[number];

export const VISIBILITYS = ['public', 'private', 'unlisted'] as const;
export type Visibility = typeof VISIBILITYS[number];

export const TIERS = ['free', 'plus', 'pro'] as const;
export type Tier = typeof TIERS[number];

export interface Metadata {
    estimatedDuration:  number | 0;
    topic:              string | '';
    tags:               string[] | [];
    source:             string | '';
    level:              Level | null;
    type:               WriteTestType | null;
    version:            number | 0;
}

export interface Settings {
    showAnswersAfterSubmit: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean
    allowReview: boolean
    timeLimitSec: number;
    maxAttempts: number;
    passingScore: number;
    passingBand: number;
}

export interface Access {
    isFree:     boolean;
    price:      number;
    tier:       Tier | null;
}

export interface Stats{
    totalQuestions:     number;
    totalMarks:         number;
}
