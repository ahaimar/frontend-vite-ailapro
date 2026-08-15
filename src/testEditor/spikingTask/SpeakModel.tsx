import React, { useState, useCallback, useRef, useEffect } from "react";
import {
    X, Plus, BookOpen, Pencil,
    Trash2, ChevronDown, Mic, Play, Square,
    AlignLeft, Tag, AlertCircle,
    Upload, Volume2, XCircle,
    SlidersHorizontal,
    Loader2,
} from "lucide-react";
import type { SpeakForm, PartForm, SpeakType, SpeakTest, } from "./speak.ts";
import { Button, Field, Input, Menu, SectionSimple, Select, Textarea } from "../../ui/UI.tsx";
import { LEVELS, MET_TYPE, STATUSES, TIERS, VISIBILITYS, type Access, type Level, type Metadata, type Settings, type Stats, type Status, type Tier, type Visibility, type WriteTestType } from "../index.ts";
import { adminService } from "../../context/authService.ts";

interface SpeakModalProps {
    form:      SpeakForm;
    setForm:   React.Dispatch<React.SetStateAction<SpeakForm>>;
    onSave:    () => Promise<void>;
    onClose:   () => void;
    editingId: string | null;
    loading:   boolean;
    error?:    string | null;
}

type Tab = "info" | "parts" | "settings";

// ── Constants ──────────────────────────────────────────────────────────────────

const SPEAK_TYPES: { value: SpeakType; label: string; description: string }[] = [
    { value: "interview",  label: "Interview",  description: "Part 1 – short personal questions" },
    { value: "cue_card",   label: "Cue Card",   description: "Part 2 – 2-min individual long turn" },
    { value: "discussion", label: "Discussion", description: "Part 3 – abstract two-way discussion" },
];
;

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls =
    "w-full bg-slate-900 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-slate-100 " +
    "placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 " +
    "focus:border-indigo-500/60 transition-all";

const labelCls = "block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5";

// ── Helpers ────────────────────────────────────────────────────────────────────

const emptyPart = (): PartForm => ({
    speakType:   "interview",
    textBody:    "",
    explanation: "",
    audioFile:   null,
});

// ── TTS hook ───────────────────────────────────────────────────────────────────
// Uses the browser's built-in SpeechSynthesis for text preview.
// Separate from the audio file player below.

function useTTS() {
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [ttsPlaying, setTtsPlaying] = useState<number | null>(null);

    const speak = useCallback((text: string, index: number) => {
        window.speechSynthesis.cancel();
        if (ttsPlaying === index) { setTtsPlaying(null); return; }

        const utterance   = new SpeechSynthesisUtterance(text);
        utterance.rate    = 0.92;
        utterance.pitch   = 1;
        utterance.lang    = "en-GB";
        utterance.onend   = () => setTtsPlaying(null);
        utterance.onerror = () => setTtsPlaying(null);
        utterRef.current  = utterance;

        setTtsPlaying(index);
        window.speechSynthesis.speak(utterance);
    }, [ttsPlaying]);

    const stopTTS = useCallback(() => {
        window.speechSynthesis.cancel();
        setTtsPlaying(null);
    }, []);

    return { speak, stopTTS, ttsPlaying };
}

// ── Audio file player hook ─────────────────────────────────────────────────────
// Plays either a local File (object URL) or an existing Cloudinary URL.

function useAudioPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const objUrlRef = useRef<string | null>(null);
    const [audioPlaying, setAudioPlaying] = useState<number | null>(null);

    const playAudio = useCallback((src: string, index: number) => {
        // Stop any currently playing audio first
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (objUrlRef.current) {
            URL.revokeObjectURL(objUrlRef.current);
            objUrlRef.current = null;
        }

        if (audioPlaying === index) {
            setAudioPlaying(null);
            return;
        }

        const audio = new Audio(src);
        audio.onended  = () => setAudioPlaying(null);
        audio.onerror  = () => setAudioPlaying(null);
        audioRef.current = audio;
        setAudioPlaying(index);
        audio.play();
    }, [audioPlaying]);

    const playFile = useCallback((file: File, index: number) => {
        const url = URL.createObjectURL(file);
        objUrlRef.current = url;
        playAudio(url, index);
    }, [playAudio]);

    const stopAudio = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (objUrlRef.current) { URL.revokeObjectURL(objUrlRef.current); objUrlRef.current = null; }
        setAudioPlaying(null);
    }, []);

    return { playFile, playAudio, stopAudio, audioPlaying };
}

// ── AudioUploadField ───────────────────────────────────────────────────────────
// Renders the per-part audio upload UI: file picker, existing URL badge,
// local file name + play/stop, clear button.

interface AudioUploadFieldProps {
    partIndex:   number;
    part:        PartForm;
    audioPlaying: number | null;
    onPickFile:  (index: number, file: File | null) => void;
    onPlayFile:  (file: File, index: number) => void;
    onPlayUrl:   (url: string, index: number) => void;
    onStopAudio: () => void;
}

const AudioUploadField: React.FC<AudioUploadFieldProps> = ({
    partIndex, part, audioPlaying,
    onPickFile, onPlayFile, onPlayUrl, onStopAudio,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isPlaying    = audioPlaying === partIndex;

    // Determine what audio source exists
    const hasLocalFile = !!part.audioFile;
    const hasRemoteUrl = !!part.audio_url && !hasLocalFile;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        onPickFile(partIndex, file);
        // Reset input so picking the same file again fires onChange
        e.target.value = "";
    };

    const handleClear = () => {
        onStopAudio();
        onPickFile(partIndex, null);
    };

    const handlePlayToggle = () => {
        if (isPlaying) { onStopAudio(); return; }
        if (part.audioFile) onPlayFile(part.audioFile, partIndex);
        else if (part.audio_url) onPlayUrl(part.audio_url, partIndex);
    };

    return (
        <div className="space-y-2">
            <label className={labelCls}>Audio recording</label>

            {/* Pick file button */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                               uppercase tracking-widest bg-slate-800 hover:bg-slate-700 text-slate-300
                               border border-slate-700 transition-all"
                >
                    <Upload size={11} />
                    {hasLocalFile || hasRemoteUrl ? "Replace audio" : "Upload audio"}
                </button>

                {/* Play/stop current audio (local file or existing URL) */}
                {(hasLocalFile || hasRemoteUrl) && (
                    <button
                        type="button"
                        onClick={handlePlayToggle}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]
                                   font-bold uppercase tracking-widest border transition-all ${
                            isPlaying
                                ? "bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                    >
                        {isPlaying
                            ? <><Square size={10} /> Stop</>
                            : <><Play   size={10} /> Play</>
                        }
                    </button>
                )}

                {/* Clear button */}
                {(hasLocalFile || hasRemoteUrl) && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Remove audio"
                        className="text-slate-600 hover:text-rose-400 transition-colors"
                    >
                        <XCircle size={14} />
                    </button>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {/* Status line */}
            {hasLocalFile && (
                <p className="flex items-center gap-1.5 text-[11px] text-indigo-400">
                    <Volume2 size={10} />
                    <span className="truncate max-w-65">{part.audioFile!.name}</span>
                    <span className="text-slate-600 shrink-0">
                        ({(part.audioFile!.size / 1024 / 1024).toFixed(1)} MB) — will upload on save
                    </span>
                </p>
            )}
            {hasRemoteUrl && !hasLocalFile && (
                <p className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                    <Volume2 size={10} />
                    <span>Existing recording on Cloudinary</span>
                </p>
            )}
            {!hasLocalFile && !hasRemoteUrl && (
                <p className="text-[11px] text-slate-600">No audio — TTS will be used during practice.</p>
            )}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────────

const SpeakModal: React.FC<SpeakModalProps> = ({
    form, setForm, onSave, onClose, editingId, loading, error,
}) => {
    const [activeTab, setActiveTab] = useState<Tab>("info");
    const { speak, stopTTS, ttsPlaying }                       = useTTS();
    const { playFile, playAudio, stopAudio, audioPlaying }     = useAudioPlayer();

    const isEditing = !!editingId;
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    


    useEffect(() => {
        if (!editingId) return;

        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFetchLoading(true);
        setFetchError(null);

        adminService.getSpeakTaskById(editingId)
            .then((full: SpeakTest) => {
                if (cancelled) return;
                setForm({
                    title: full.title,
                    description: full.description,
                    status: full.status,
                    metadata: full.metadata as Metadata ?? null,
                    visibility: full.visibility as Visibility ?? null,
                    settings: full.settings as Settings ?? null,
                    access: full.access as Access ?? null,
                    stats: full.stats as Stats ?? null,
                    parts: (Array.isArray(full.parts) ? full.parts : []).map(p => ({
                        ...p,
                        audioFile: null,
                    })),
                });
            })
            .catch((err: Error) => {
                if (!cancelled) setFetchError(err.message);
            })
            .finally(() => {
                if (!cancelled) setFetchLoading(false);
            });

        return () => { cancelled = true; };
    }, [editingId, setForm]);

    // ── Form helpers ───────────────────────────────────────────────────────────

    const setTop  = (patch: Partial<SpeakForm>)            => setForm(f => ({ ...f, ...patch }));

    const update = useCallback(
        <K extends keyof SpeakForm>(key: K, value: SpeakForm[K]) =>
            setForm(prev => ({ ...prev, [key]: value })),
        [setForm],
    );

    const updateMeta = useCallback(
        <K extends keyof NonNullable<SpeakForm["metadata"]>>(key: K, value: NonNullable<SpeakForm["metadata"]>[K]) =>
            setForm(prev => ({ ...prev, metadata: ({ ...(prev.metadata ?? {}), [key]: value } as SpeakForm["metadata"]) })),
        [setForm],
    );

    const updateSettings = useCallback(
        <K extends keyof NonNullable<SpeakForm["settings"]>>(key: K, value: NonNullable<SpeakForm["settings"]>[K]) =>
            setForm(prev => ({ ...prev, settings: ({ ...(prev.settings ?? {}), [key]: value } as SpeakForm["settings"]) })),
        [setForm],
    );

    const updateAccess = useCallback(
        <K extends keyof NonNullable<SpeakForm["access"]>>(key: K, value: NonNullable<SpeakForm["access"]>[K]) =>
            setForm(prev => ({ ...prev, access: ({ ...(prev.access ?? {}), [key]: value } as SpeakForm["access"]) })),
        [setForm],
    );

    const addPart = () =>
        setForm(f => ({ ...f, parts: [...f.parts, emptyPart()] }));

    const removePart = (i: number) => {
        stopTTS(); stopAudio();
        setForm(f => ({ ...f, parts: f.parts.filter((_, idx) => idx !== i) }));
    };

    const patchPart = (i: number, patch: Partial<PartForm>) =>
        setForm(f => ({
            ...f,
            parts: f.parts.map((p, idx) => idx === i ? { ...p, ...patch } : p),
        }));

    const handlePickFile = (index: number, file: File | null) => {
        patchPart(index, {
            audioFile:   file,
            ...(file === null ? { audio_url: "", audio_public_id: null } : {}),
        });
    };

    // ── Tabs ───────────────────────────────────────────────────────────────────

    const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
        { key: "info",  label: "Info",  icon: <AlignLeft size={13} /> },
        { key: "settings",  label: "Settings",  icon: <SlidersHorizontal size={13} /> },
        { key: "parts", label: "Parts", icon: <Mic size={13} />, badge: form.parts.length },
    ];

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
                aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isEditing ? "Edit Speaking Test" : "Create Speaking Test"}
                    className="w-full max-w-5xl pointer-events-auto flex flex-col rounded-2xl
                               overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl"
                    style={{ maxHeight: "92dvh" }}
                >
                    {/* ── Header ─────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between px-5 py-3.5
                                    border-b border-slate-800 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
                                            flex items-center justify-center">
                                {isEditing
                                    ? <Pencil   size={14} className="text-indigo-400" />
                                    : <BookOpen size={14} className="text-indigo-400" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-100">
                                    {isEditing ? "Edit speaking test" : "New speaking test"}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                    IELTS Speaking · Audio per part
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            aria-label="Close dialog"
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500
                                       hover:text-rose-500 hover:bg-slate-800 transition-all disabled:opacity-40"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* ── Tabs ───────────────────────────────────────────────── */}
                    <div className="flex border-b border-slate-800 bg-slate-900 shrink-0 px-1 gap-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase
                                           tracking-widest border-b-2 transition-all ${
                                    activeTab === tab.key
                                        ? "border-indigo-500 text-indigo-400"
                                        : "border-transparent text-slate-500 hover:text-slate-300"
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                                {tab.badge !== undefined && (
                                    <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                        activeTab === tab.key
                                            ? "bg-indigo-500/30 text-indigo-300"
                                            : "bg-slate-700 text-slate-400"
                                    }`}>
                                        {tab.badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* ── Body ───────────────────────────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

                        {/* Error banner */}
                        {error && (
                            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30
                                            rounded-xl px-4 py-3">
                                <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-rose-300">{error}</span>
                            </div>
                        )}
                        {fetchLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 size={24} className="text-indigo-400 animate-spin" />
                                <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                                    Loading test…
                                </span>
                            </div>
                        ) : fetchError ? (
                            <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
                                <AlertCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />
                                <span className="text-xs text-rose-300">Failed to load: {fetchError}</span>
                            </div>
                        ) : (
                            <>


                                {/* ── INFO TAB ──────────────────────────────────────── */}
                                {activeTab === "info" && (
                                    <div className="space-y-5">
                                        <SectionSimple title="Basic info" className="space-y-4">
                                            <div className="w-full flex flex-1 justify-between">
                                                <Field label="Title" htmlFor="form-title" required>
                                                    <Input
                                                        placeholder="e.g. IELTS Speaking Mock – Environment"
                                                        value={form.title}
                                                        onChange={e => setTop({ title: e.target.value })}
                                                    />
                                                </Field>

                                                <Field label="Status" htmlFor="form-status">
                                                    <div className="relative">
                                                        <Select
                                                            className={inputCls + " appearance-none pr-8"}
                                                            value={form.status}
                                                            onChange={e => setTop({ status: e.target.value as Status })}
                                                        >
                                                            {STATUSES.map(s => (
                                                                <option key={s} value={s}>
                                                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                                                </option>
                                                            ))}
                                                        </Select>
                                                    </div>
                                                </Field>
                                            </div>
                                            

                                            <Field label="Description" htmlFor="form.description">
                                                <Textarea
                                                    rows={3}
                                                    className={inputCls + " resize-none"}
                                                    placeholder="Brief overview shown to the student before they begin…"
                                                    value={form.description}
                                                    onChange={e => setTop({ description: e.target.value })}
                                                />
                                            </Field>

                                            
                                        </SectionSimple>

                                    </div>
                                )}

                                {activeTab === "settings" && (
                                    <>
                                        <Menu title="Metadata" subtitle="Write test metadata">
                                            <Field label="Duration (min)" htmlFor="meta-estimatedDuration">
                                                <Input
                                                    id="meta-estimatedDuration"
                                                    type="number"
                                                    value={form.metadata?.estimatedDuration ?? ''}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        updateMeta("estimatedDuration", val === "" ? 0 : Number(val));
                                                    }}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Topic" htmlFor="meta-topic">
                                                <Input
                                                    id="meta-topic"
                                                    type="text"
                                                    value={form.metadata?.topic ?? ''}
                                                    onChange={e => updateMeta("topic", e.target.value)}
                                                    placeholder="e.g. Environment, Technology"
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Source" htmlFor="meta-source">
                                                <Input
                                                    id="meta-source"
                                                    type="text"
                                                    value={form.metadata?.source ?? ''}
                                                    onChange={e => updateMeta("source", e.target.value)}
                                                    placeholder="e.g. Cambridge, Internal"
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Level" htmlFor="meta-level">
                                                <Select
                                                    id="meta-level"
                                                    value={form.metadata?.level ?? ''}
                                                    onChange={e => updateMeta("level", (e.target.value as Level) || null)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Level</option>
                                                    {LEVELS.map(l => (
                                                        <option key={l} value={l}>
                                                            {l}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </Field>

                                            <Field label="Write Test Type" htmlFor="meta-type">
                                                <Select
                                                    id="meta-type"
                                                    value={form.metadata?.type ?? ''}
                                                    onChange={e => updateMeta("type", (e.target.value as WriteTestType) || null)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Type</option>
                                                    {MET_TYPE.map(s => (
                                                        <option key={s} value={s}>
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </Field>

                                            <Field label="Tags (comma separated)" htmlFor="meta-tags">
                                                <Input
                                                    id="meta-tags"
                                                    type="text"
                                                    value={form.metadata?.tags?.join(', ') ?? ''}
                                                    onChange={e => {
                                                        const raw = e.target.value;
                                                        const parsed = raw
                                                            ? raw.split(',').map(t => t.trim()).filter(Boolean)
                                                            : [];
                                                        updateMeta("tags", parsed);
                                                    }}
                                                    placeholder="e.g. essay, grammar, academic"
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Version" htmlFor="meta-version">
                                                <Input
                                                    id="meta-version"
                                                    type="number"
                                                    value={form.metadata?.version ?? ''}
                                                    onChange={e => updateMeta("version", Number(e.target.value))}
                                                    disabled={loading}
                                                />
                                            </Field>
                                        </Menu>
                                        
                                        {/* Settings checkboxes */}
                                        <Menu title="Settings" subtitle="Write test settings">
                                            <Field label="Show Answers After Submit" htmlFor="settings-showAnswersAfterSubmit">
                                                <Input
                                                    id="settings-showAnswersAfterSubmit"
                                                    type="checkbox"
                                                    checked={!!form.settings?.showAnswersAfterSubmit}
                                                    onChange={e => updateSettings('showAnswersAfterSubmit', e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Shuffle Questions" htmlFor="settings-shuffleQuestions">
                                                <Input
                                                    id="settings-shuffleQuestions"
                                                    type="checkbox"
                                                    checked={!!form.settings?.shuffleQuestions}
                                                    onChange={e => updateSettings('shuffleQuestions', e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Shuffle Options" htmlFor="settings-shuffleOptions">
                                                <Input
                                                    id="settings-shuffleOptions"
                                                    type="checkbox"
                                                    checked={!!form.settings?.shuffleOptions}
                                                    onChange={e => updateSettings('shuffleOptions', e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Allow Review" htmlFor="settings-allowReview">
                                                <Input
                                                    id="settings-allowReview"
                                                    type="checkbox"
                                                    checked={!!form.settings?.allowReview}
                                                    onChange={e => updateSettings('allowReview', e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Time Limit (Seconds)" htmlFor="settings-timeLimitSec">
                                                <Input
                                                    id="settings-timeLimitSec"
                                                    type="number"
                                                    value={form.settings?.timeLimitSec ?? ''}
                                                    onChange={e => updateSettings('timeLimitSec', Number(e.target.value))}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Max Attempts" htmlFor="settings-maxAttempts">
                                                <Input
                                                    id="settings-maxAttempts"
                                                    type="number"
                                                    value={form.settings?.maxAttempts ?? ''}
                                                    onChange={e => updateSettings('maxAttempts', Number(e.target.value))}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Passing Score" htmlFor="settings-passingScore">
                                                <Input
                                                    id="settings-passingScore"
                                                    type="number"
                                                    value={form.settings?.passingScore ?? ''}
                                                    onChange={e => updateSettings('passingScore', Number(e.target.value))}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            <Field label="Passing Band" htmlFor="settings-passingBand">
                                                <Input
                                                    id="settings-passingBand"
                                                    type="number"
                                                    value={form.settings?.passingBand ?? ''}
                                                    onChange={e => updateSettings('passingBand', Number(e.target.value))}
                                                    disabled={loading}
                                                />
                                            </Field>
                                        </Menu>

                                        <Menu title="Access Control" subtitle="Configure pricing and tier access">
                                            <Field label="Is Free" htmlFor="access-isFree">
                                                <Input
                                                    id="access-isFree"
                                                    type="checkbox"
                                                    checked={!!form.access?.isFree}
                                                    onChange={e => updateAccess("isFree", e.target.checked)}
                                                    disabled={loading}
                                                />
                                            </Field>

                                            {!form.access?.isFree && (
                                                <Field label="Price" htmlFor="access-price">
                                                    <Input
                                                        id="access-price"
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={form.access?.price ?? ''}
                                                        onChange={e => updateAccess("price", Number(e.target.value))}
                                                        disabled={loading}
                                                    />
                                                </Field>
                                            )}

                                            <Field label="Access Tier" htmlFor="access-tier">
                                                <Select
                                                    id="access-tier"
                                                    value={form.access?.tier ?? ''}
                                                    onChange={e => updateAccess("tier", (e.target.value as Tier) || null)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Tier</option>
                                                    {TIERS.map(t => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </Field>

                                            <Field label="visibility" htmlFor="visibility">
                                                <Select
                                                    id="visibility"
                                                    value={form?.visibility as Visibility}
                                                    onChange={e => update("visibility", e.target.value as Visibility)}
                                                    disabled={loading}
                                                >
                                                    <option value="">Select Visibility</option>
                                                    {VISIBILITYS.map(t => (
                                                        <option key={t} value={t}>
                                                            {t}
                                                        </option>
                                                    ))}
                                                </Select>
                                            </Field>
                                        </Menu>
                                    </>
                                )}

                                {/* ── PARTS TAB ─────────────────────────────────────── */}
                                {activeTab === "parts" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                Speaking parts
                                            </h3>
                                            <button
                                                type="button"
                                                onClick={addPart}
                                                disabled={form.parts.length >= 3}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px]
                                                        font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-700
                                                        text-slate-300 border border-slate-700 transition-all
                                                        disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <Plus size={11} /> Add part
                                            </button>
                                        </div>

                                        {form.parts.length === 0 && (
                                            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl">
                                                <Mic size={32} className="mx-auto text-slate-700 mb-3" />
                                                <p className="text-xs text-slate-600">No parts yet — add one above.</p>
                                            </div>
                                        )}

                                        {form.parts.map((part, i) => {
                                            const typeInfo   = SPEAK_TYPES.find(t => t.value === part.speakType);
                                            const isTtsPl    = ttsPlaying === i;

                                            return (
                                                <div key={i} className="border border-slate-800 rounded-xl overflow-hidden">

                                                    {/* Part header */}
                                                    <div className="flex items-center gap-3 bg-slate-900 px-4 py-2.5">
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest shrink-0">
                                                            Part {i + 1}
                                                        </span>

                                                        {/* Type selector */}
                                                        <div className="relative flex-1">
                                                            <Select
                                                                value={part.speakType}
                                                                onChange={e => patchPart(i, { speakType: e.target.value as SpeakType })}
                                                            >
                                                                {SPEAK_TYPES.map(t => (
                                                                    <option key={t?.value} value={t.value}>{t?.label}</option>
                                                                ))}
                                                            </Select>
                                                            <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                                        </div>

                                                        {/* TTS preview button */}
                                                        <button
                                                            type="button"
                                                            disabled={!part?.textBody?.trim()}
                                                            onClick={() => isTtsPl ? stopTTS() : speak(part.textBody, i)}
                                                            title={isTtsPl ? "Stop TTS preview" : "Preview text as speech"}
                                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px]
                                                                    font-bold uppercase tracking-widest border transition-all
                                                                    disabled:opacity-30 disabled:cursor-not-allowed ${
                                                                isTtsPl
                                                                    ? "bg-rose-500/15 border-rose-500/40 text-rose-400 hover:bg-rose-500/25"
                                                                    : "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20"
                                                            }`}
                                                        >
                                                            {isTtsPl
                                                                ? <><Square size={10} /> Stop</>
                                                                : <><Play   size={10} /> TTS</>
                                                            }
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => removePart(i)}
                                                            disabled={form.parts.length === 1}
                                                            className="text-slate-600 hover:text-rose-400 transition-colors disabled:opacity-30 shrink-0"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>

                                                    {/* Type description badge */}
                                                    {typeInfo && (
                                                        <div className="px-4 pt-2 pb-0">
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500
                                                                            bg-slate-900 border border-slate-800 rounded-md px-2 py-0.5">
                                                                <Tag size={9} />
                                                                {typeInfo.description}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="px-4 pb-4 pt-3 space-y-4 bg-slate-950">

                                                        {/* Spoken text */}
                                                        <Field label="Spoken text / prompt" htmlFor="part-textBody">
                                                            <Textarea
                                                                rows={5}
                                                                className={inputCls + " resize-y"}
                                                                placeholder={
                                                                    part.speakType === "cue_card"
                                                                        ? "Describe a time when…\n\nYou should say:\n  – what happened\n  – where it was\n  – how you felt"
                                                                        : "Type the examiner's question or prompt here. This text will be read aloud to the student."
                                                                }
                                                                value={part?.textBody}
                                                                onChange={e => patchPart(i, { textBody: e.target.value })}
                                                            />
                                                            <p className={`mt-1 text-right text-[11px] transition-colors ${
                                                                (part.textBody?.trim()?.length ?? 0) === 0 ? "text-slate-700" : "text-slate-500"

                                                            }`}>
                                                                {part.textBody?.trim()?.split(/\s+/).filter(Boolean).length} words
                                                            </p>
                                                        </Field>

                                                        {/* ── Audio upload ── */}
                                                        <div className="border-t border-slate-800/60 pt-4">
                                                            <AudioUploadField
                                                                partIndex={i}
                                                                part={part}
                                                                audioPlaying={audioPlaying}
                                                                onPickFile={handlePickFile}
                                                                onPlayFile={playFile}
                                                                onPlayUrl={playAudio}
                                                                onStopAudio={stopAudio}
                                                            />
                                                        </div>

                                                        {/* Explanation */}
                                                        <Field label="Explanation / model answer (admin only)" htmlFor="part.explanation">
                                                            <Textarea
                                                                rows={3}
                                                                className={inputCls + " resize-none"}
                                                                placeholder="Notes on what a high-band answer would include…"
                                                                value={part.explanation}
                                                                onChange={e => patchPart(i, { explanation: e.target.value })}
                                                            />
                                                        </Field>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}

                    </div>

                    {/* ── Footer ─────────────────────────────────────────────── */}
                    <div className="flex items-center justify-between gap-2.5 px-5 py-3.5
                                    border-t border-slate-800 bg-slate-900 shrink-0">
                        <span className="text-[11px] text-slate-600 font-semibold uppercase tracking-widest">
                            {form.parts.length} part{form.parts.length !== 1 ? "s" : ""}
                            {form.metadata?.estimatedDuration
                                ? ` · ${form.metadata?.estimatedDuration} min`
                                : ""}
                            {form.parts.some(p => p.audioFile) && (
                                <span className="ml-2 text-indigo-400">
                                    · {form.parts.filter(p => p.audioFile).length} pending upload{form.parts.filter(p => p.audioFile).length !== 1 ? "s" : ""}
                                </span>
                            )}
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                label="Cancel"
                                variant="ghost"
                                onClick={!loading && !fetchLoading ? onClose : undefined}
                                disabled={loading} 
                            />
                            <Button
                                label={isEditing ? "Update test" : "Create test"}
                                variant="save"
                                onClick={onSave}
                                disabled={loading || fetchLoading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default SpeakModal;