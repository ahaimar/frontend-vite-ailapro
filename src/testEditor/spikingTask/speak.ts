

import type { Access, Metadata, Settings, Stats, Status, Visibility } from "..";

export type SpeakType  = "interview" | "cue_card" | "discussion";

// ── Part ──────────────────────────────────────────────────────────────────────

/** Shape stored in MongoDB / returned by the API */
export interface Parts {
    speakType:        SpeakType;
    textBody:         string;
    explanation:      string;
    audio_url?:       string;       // Cloudinary secure URL (read-only from API)
    audio_public_id?: string | null;
}

/**
 * Shape used *inside the form only*.
 * `audioFile` holds the File the admin picked; it is never sent as JSON —
 * it goes into FormData as `audio_N`.  When editing, `audio_url` tells the
 * UI whether an existing recording is already on Cloudinary.
 */
export interface PartForm extends Parts {
    
    audioFile?: File | null;        // local File object, form-only
}

// ── API shapes ────────────────────────────────────────────────────────────────

export interface SpeakTest {
    _id:             string;
    title:           string;
    description:     string;
    parts:           Parts[];
    status:          Status;
    
    /** in new verstion added this */
    metadata:       Metadata | null;
    settings:       Settings | null;
    visibility:     Visibility | null;
    access:         Access | null;
    stats:          Stats | null;
    /** */
    
    createdBy?:      string;
    lastModifiedBy?: string;
    createdAt?:      string;
    updatedAt?:      string;
}

// ── Form shape ────────────────────────────────────────────────────────────────

/**
 * Everything the modal manages.  `parts` uses `PartForm` so each part can
 * carry its pending File upload alongside the rest of its data.
 */
export interface SpeakForm {
    title:       string;
    description: string;
    parts:       PartForm[];
    status:      Status;
    metadata:       Metadata | null;
    settings:       Settings | null;
    visibility:     Visibility | null;
    access:         Access | null;
    stats:          Stats | null;
    
}

export type SpeakListItem = Omit<SpeakTest, 'lastModifiedBy'> & {
    parts?: PartForm[];
};

// ── API response wrappers ─────────────────────────────────────────────────────

export interface PaginatedResponse {
    success:    boolean;
    total:      number;
    page:       number;
    totalPages: number;
    data:       SpeakTest[];
}

export interface SingleResponse {
    success:  boolean;
    data:     SpeakTest;
    message?: string;
}