import type { Access, Metadata, Settings, Stats, Visibility } from "..";



export const QUESTION_TYPES = [
    'form_completion',
    'mcq',
    'map_labelling',
    'table',
    'matching',
    'sentence_completion',
] as const;

export const TABS = [
    { id: "info",     label: "Test info"            },
    { id: "passage",  label: "Transcript"           },
    { id: "settings", label: "Settings"             },
    { id: "passages", label: "Passages & Questions" },
] as const;


export type QuestionType = typeof QUESTION_TYPES[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    form_completion:     'Form Completion',
    mcq:                 'QCM',
    map_labelling:       'Map Labelling',
    table:               'Table',
    matching:            'Matching',
    sentence_completion: 'Sentence Completion',
};

export const ACCENTS = ['british', 'australian', 'american', 'nz'] as const;
export type Accent = typeof ACCENTS[number];

export const ACCENT_LABELS: Record<Accent, string> = {
    british:    'British',
    australian: 'Australian',
    american:   'American',
    nz:         'New Zealand',
};

export const STATUSES = ['draft', 'published', 'archived'] as const;
export type Status = typeof STATUSES[number];

export interface Cell {
  value: string;
  
  /** Option placed into this cell by the test-taker (viewer-only —
    *  the editor/author side never writes this).
    * */
  answer?: string;
}

export interface Row {
  cells: Cell[];
}

export interface TableProp {
  rows: Row[];
  maxRows: number;
  maxCols: number;
}

/* ─────────────────────────────────────────────
   Sub-document interfaces — mirror schema exactly
───────────────────────────────────────────── */

export interface FormBody {
    instructions:       string;
    question:           string;
    correctAnswer:      string;
    options:            string[];
    tableProp:          TableProp | null;      // a new prop
    explanation:        string;
    diagram_url?:       string;         // Cloudinary secure_url, "" if none
    diagram_public_id?: string | null;  // read-only — never set by client
}

/** Mirrors the Answer sub-schema */
export interface Answer {
    _id?:     string;
    qusForm: {
        From: number | undefined;
        To:   number | undefined;
    };
    formType: QuestionType;     // schema enum, default 'mcq'
    formBody: FormBody[];
}

/**
 * Mirrors passageSchema.
 * FIX: was using title / instructions / body / passingScore
 *      which don't exist in the schema.
 */
export interface Passage {
    _id?:                string;
    partNumber:          1 | 2 | 3 | 4;   // required enum
    audioDuration:       number;           // default 0
    startQuestionNumber: number;           // default 1, range 1-40
    questions:           Answer[];         // FIX: was 'body'
    explanation:         string;
    marks:               number;           // default 10
}

/** Top-level ListenTest — mirrors listenTestSchema */
export interface ListenTest {
    _id?:               string;
    title:              string;
    description:        string;
    transcript:         string;
    audio_url:          string | File;   // string when loaded from server, File when picked locally
    audio_public_id?:   string;        // Cloudinary public_id — returned by server, never set client-side
    type:               string;
    createdAt?:         string;
    updatedAt?:         string;
    status?:            Status;
    passages:           Passage[];
    
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

export type ListenForm = Omit<ListenTest, '_id' | 'createdAt' | 'updatedAt'>;

export type ListenListItem = Omit<ListenTest, 'lastModifiedBy'> & {
    passages?: Passage[];
};

export interface PaginationMeta {
    total: number;
    skip:  number;   // FIX: API returns skip, not page
    limit: number;
}

/* ─────────────────────────────────────────────
   Empty-state factories — schema-correct defaults
───────────────────────────────────────────── */

export const EMPTY_FORM_BODY = (): FormBody => ({
    instructions:      '',
    question:          '',
    correctAnswer:     '',
    options:           [],
    tableProp:         null,      // a new prop
    explanation:       '',
    diagram_url:       '',
    diagram_public_id: null,
});

export const emptyAnswer = (): Answer => ({
    qusForm:  { From: undefined, To: undefined },
    formType: 'mcq',
    formBody: [EMPTY_FORM_BODY()],
});

/**
 * FIX: emptyPassage now uses schema fields.
 * partNumber is 1-based and maps to the passage index.
 */
export const emptyPassage = (index: number): Passage => ({
    partNumber:          Math.min(index, 4) as 1 | 2 | 3 | 4,
    audioDuration:       0,
    startQuestionNumber: 1,
    questions:           [emptyAnswer()],   // FIX: was 'body'
    explanation:         '',
    marks:               10,
});

export const EMPTY_FORM: ListenForm = {
    title:          '',
    description:    '',
    transcript:     '',
    audio_url:      '',
    type:           'Listening',
    passages:       [emptyPassage(1)],
    status:         'draft',
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

/* ─────────────────────────────────────────────
   Validation limits — kept in sync with schema
───────────────────────────────────────────── */

export const LIMITS = {
    TRANSCRIPT_MIN:  500,
    PASSAGES_MAX:    4,
    PASSAGES_MIN:    1,
    QUESTIONS_MAX:   40,
    QUESTIONS_MIN:   1,
    OPTIONS_MIN:     2,
    OPTIONS_MAX:     5,
    DURATION_MIN:    5,
    DURATION_MAX:    180,
    TITLE_MIN:       3,
    TITLE_MAX:       200,
    MARKS_MIN:       0,
    PART_NUMBERS:    [1, 2, 3, 4] as const,
} as const;

/* ─────────────────────────────────────────────
   Utilities
───────────────────────────────────────────── */

export function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Count total FormBody rows across all passages and answers,
 * then sync back to metadata.totalQuestions.
 * FIX: was summing sec.body.length (Answer count) instead of
 *      the actual formBody row count.
 */
export function syncTotalQuestions(form: ListenForm): ListenForm {
    const total = form.passages.reduce(
        (sum, passage) =>
            sum + passage.questions.reduce(          // FIX: was passage.body
                (qSum, answer) => qSum + answer.formBody.length,
                0,
            ),
        0,
    );
    return {
        ...form,
        stats: { ...form.stats, totalQuestions: total },
    };
}

/**
 * Single source of truth for the "[QuestionN]" / "{QuestionN}" matching-slot
 * syntax used inside TableProp cells. Both the editor (to highlight slots
 * as the author types) and the viewer (to decide which cells are
 * drop-targets) must use this — never re-derive the regex locally.
 */
export const QUESTION_SLOT_REGEX = /[[{](?:Question|Q)\s*(\d+)[\]}]/i;

/** Returns the question number string if the cell value is a slot marker, else null. */
export function parseQuestionSlot(value: string): string | null {
  const match = value.match(QUESTION_SLOT_REGEX);
  return match ? match[1] : null;
}

/** Table-wide row/col ceiling. Keep in sync with tablePropSchema's `max` on both fields. */
export const TABLE_HARD_CAP = 5;