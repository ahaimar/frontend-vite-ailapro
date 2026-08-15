import type { Access, Metadata, Settings, Stats, Status, Visibility, WriteTestType } from "..";

export const QUESTION_TYPES = [
    'multiple_choice',
    'true_false',
    'yes_no',
    'matching_headings',
    'matching_features',
    'matching_sentence_endings',
    'summary_completion',
    'list_selection',
    'short_answer',
] as const;

export type QuestionType = typeof QUESTION_TYPES[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    multiple_choice:           'Multiple Choice',
    true_false:                'True / False',
    yes_no:                    'Yes / No',
    matching_headings:         'Matching Headings',
    matching_features:         'Matching Features',
    matching_sentence_endings: 'Matching Sentence Endings',
    summary_completion:        'Summary Completion',
    list_selection:            'List Selection',
    short_answer:              'Short Answer',
};

export const OPTION_BASED_TYPES: QuestionType[] = [
    'multiple_choice',
    'list_selection',
    'matching_features',
    'matching_headings',
    'matching_sentence_endings',
];

export interface FormBody {
    instructions:       string;
    question:           string;
    correctAnswer:      string;
    options:            string[] | [];
    explanation:        string | '';
}

export interface Answer {
    _id?:    string;
    qusForm: {
        From: number | undefined;
        To:   number | undefined;
    };
    formType:       QuestionType | undefined;
    formBody:       FormBody[] | [];
}

export interface Section {
    _id?:          string;
    title:         string;
    instructions:  string;
    body:          Answer[];
    passingScore:  number;
}

export interface ReadTest {
    _id?:        string;
    createdAt?:  string;
    updatedAt?:  string;
    title:       string;
    description: string;
    body:        string;     // min 500 chars — validated by schema
    sections:    Section[];  // min 1, max 4
    status?:     Status;     // 'draft' | 'published' | 'archived'

    /** in new verstion added this */
    metadata:       Metadata;
    settings:       Settings;
    visibility:     Visibility | null;
    access:         Access;
    stats:          Stats;
    /** */
    
    createdBy?:      string;
    lastModifiedBy?: string;
}

export type ReadForm = Omit<ReadTest, '_id' | 'createdAt' | 'updatedAt'>;

export type ReadListItem = Omit<ReadTest, 'lastModifiedBy'> & {
    sections?: Section[];
};

export interface PaginationMeta {
    total: number;
    page:  number;
    limit: number;
    pages: number;
}

export const EMPTY_Form_Body = (): FormBody => ({
    instructions:       '',
    question:           '',
    correctAnswer:      '',
    options:            [],
    explanation:        '',
});

export const emptyAnswer = (): Answer => ({
    qusForm:       { From: undefined, To: undefined },
    formType:      'multiple_choice',
    formBody:      [EMPTY_Form_Body()],   // always seed one row — matches ReadModal's version
});

export const emptySection = (index: number): Section => ({
    title:         `Section ${index}`,
    instructions:  '',
    body:          [emptyAnswer()],
    passingScore:  60,
});

export const EMPTY_FORM: ReadForm = {
    title:       '',
    description: '',
    body:        '',
    sections:    [emptySection(1)],
    status:      'draft',
    metadata: {
        estimatedDuration:  0,
        topic:              '',
        tags:               [],
        source:             '',
        level:              null,
        type:               null,
        version:            0,
    },
    settings: {
        showAnswersAfterSubmit: false,
        shuffleQuestions: false,
        shuffleOptions: false,
        allowReview: false,
        timeLimitSec: 0,
        maxAttempts: 0,
        passingScore: 0,
        passingBand: 0,
    },
    visibility: null,
    access:         {
        isFree:     false,
        price:      0,
        tier:       null,
    },
    stats:          {
        totalQuestions:     0,
        totalMarks:         0,
    },
};

export const LIMITS = {
    BODY_MIN:      500,   // schema: body.minlength
    SECTIONS_MAX:  4,     // schema: sections validator
    QUESTIONS_MAX: 40,    // schema: body validator per section
    OPTIONS_MIN:   2,     // schema: options validator
    OPTIONS_MAX:   5,     // schema: options validator
    DURATION_MIN:  5,     // schema: estimatedDuration.min
    DURATION_MAX:  180,   // schema: estimatedDuration.max
    TITLE_MIN:     3,     // schema: title.minlength
    TITLE_MAX:     200,   // schema: title.maxlength
    PASSING_MIN:   0,
    PASSING_MAX:   100,
} as const;

export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export function syncCountQuestions(form: ReadForm): ReadForm {
    return {
        ...form,
        sections: form.sections.map(sec => ({
            ...sec,
            countQuestion: sec.body.length,
        })),
        metadata: {
            ...form.metadata,
            type:           form.metadata?.type as WriteTestType,
        },

    };
}
