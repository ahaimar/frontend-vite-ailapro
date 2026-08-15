// ─── Task types ───────────────────────────────────────────────────────────────

import type { Access, Metadata, Settings, Stats, Visibility } from "..";

export const TASK_TYPES = [
    'graph_description',
    'letter',
    'report',
    'map_description',
    'process_description',
    'discursive_essay',
    'argument_essay',
    'opinion_essay',
] as const;

export type TaskType = typeof TASK_TYPES[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
    graph_description:   'Graph Description',
    letter:              'Letter',
    report:              'Report',
    map_description:     'Map Description',
    process_description: 'Process Description',
    discursive_essay:    'Discursive Essay',
    argument_essay:      'Argument Essay',
    opinion_essay:       'Opinion Essay',
};

/*export const MET_TYPE = ['mock', 'exam', 'mudel'] as const;
export type WriteTestType= typeof MET_TYPE[number];*/

// Grouped for <optgroup> selectors
export const TASK_TYPE_GROUPS: { label: string; types: TaskType[] }[] = [
    {
        label: 'Task 1 — Academic',
        types: ['graph_description', 'map_description', 'process_description'],
    },
    {
        label: 'Task 1 — General Training',
        types: ['letter'],
    },
    {
        label: 'Task 2',
        types: ['discursive_essay', 'argument_essay', 'opinion_essay', 'report'],
    },
];

// ─── Status ───────────────────────────────────────────────────────────────────
// Must mirror WriteSchema enum exactly

export const STATUSES = ['draft', 'published', 'archived', 'completed'] as const;
export type TestStatus = typeof STATUSES[number];

// ─── Sub-documents ────────────────────────────────────────────────────────────

export interface TaskAttempt {
    _id?:                string;
    title:               string;
    description:         string;
    question:            string;
    taskType:            TaskType | null;
    diagram_url?:        string;         // Cloudinary secure_url
    diagram_public_id?:  string | null;  // for cleanup on replace/delete — read-only client-side
    wordCount:           number;
    wordMax:             number;
    timeTakenSec:        number;
    submittedAt?:        string | null;
}

export interface UserMinDTO {
    _id:   string;
    name:  string;
    email: string;
}

// ─── Full document (API response shape) ──────────────────────────────────────

export interface WriteTest {
    _id:             string;
    title:           string;
    description:     string;
    status:          TestStatus;
    overallBand?:    number | null;   // 0–9, null until evaluated
    completedAt?:    string | null;
    tasks:           TaskAttempt[];

    /** in new verstion added this */
    metadata:       Metadata;
    settings:       Settings;
    visibility:     Visibility | null;
    access:         Access;
    stats:          Stats;
    /** */
    
    createdBy?:      string | UserMinDTO;
    lastModifiedBy?: string | UserMinDTO;
    createdAt:       string;
    updatedAt:       string;

    // Virtuals (computed server-side, read-only on client)
    totalQuestions?: number;   // always === tasks.length
    totalTimeSec?:   number;
    totalWords?:     number;
}

// ─── Form type (what the create / edit form submits) ─────────────────────────
// Strips every field the server owns: _id, timestamps, virtuals, identity refs.
// totalQuestions is a virtual — never sent by the client.

export interface WriteForm {
    title:       string;
    description: string;
    status:      TestStatus;
    overallBand: number | null;
    completedAt: string | null;
    tasks:       TaskAttempt[];
        /** in new verstion added this */
    metadata:       Metadata | null;
    settings:       Settings | null;
    visibility:     Visibility | null;
    access:         Access | null;
    stats:          Stats | null;
    /** */
}

// Lightweight shape used in list views
export type WriteListItem = Pick<WriteTest,
    | '_id' | 'title' | 'description' | 'status'
    | 'overallBand' | 'completedAt' | 'tasks'
    | 'createdAt' | 'updatedAt'
    | 'totalQuestions'
>;

// ─── Factories ────────────────────────────────────────────────────────────────

export const emptyTask = (taskIndex = 0): TaskAttempt => ({
    title:              '',
    description:        '',
    question:           '',
    taskType:           null,
    diagram_url:        '',
    diagram_public_id:  null,
    wordCount:          0,
    wordMax:            taskIndex === 0 ? 250 : 350,
    timeTakenSec:       0,
    submittedAt:        null,
});

export const EMPTY_FORM: WriteForm = {
    title:       '',
    description: '',
    status:      'draft',
    overallBand: null,
    completedAt: null,
    tasks:       [emptyTask(0)],
    /** in new verstion added this */
    metadata:       null,
    settings:       null,
    visibility:     null,
    access:         null,
    stats:          null,
    /** */
};

export const LIMITS = {
    TITLE_MIN:       3,
    TITLE_MAX:       200,
    DESC_MAX:        500,
    TASKS_MIN:       1,
    TASKS_MAX:       2,
    WORD_MAX_TASK1:  250,
    WORD_MAX_TASK2:  350,
    DURATION_MIN:    5,
    DURATION_MAX:    180,
    BAND_MIN:        0,
    BAND_MAX:        9,
} as const;