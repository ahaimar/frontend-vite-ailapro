

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
    X, Plus, BookOpen, Pencil, AlignLeft,
    FileText,
} from "lucide-react";
import {
    type Answer,
    type Passage,
    type ListenForm,
    emptyAnswer,
    emptyPassage,
    LIMITS,
    syncTotalQuestions,
    TABS,
    STATUSES,
    type Status,
} from "./listenDTO.ts";
import {
    PassagePanel,
    AudioPreview,
    UploadZone,
    useRecorder,
    type TabId,
} from "./listenUtil.tsx";
import { Button, Field, Input, Label, Menu, SectionSimple, Select, Textarea } from "../../ui/UI.tsx";
import type { DiagramFileMap } from "./ListenManager.tsx";
import { LEVELS, MET_TYPE, TIERS, VISIBILITYS, type Level, type Tier, type Visibility, type WriteTestType } from "../index.ts";

export const inp = `w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100
    placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
    focus:border-indigo-500/50 transition-all disabled:opacity-50`;

export const lbl = `text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block`;

interface ListenModalProps {
    form:      ListenForm;
    setForm:   React.Dispatch<React.SetStateAction<ListenForm>>;
    diagramFiles:         DiagramFileMap;
    onDiagramFileChange:  (pi: number, qi: number, ri: number, file: File | null) => void;
    onSave:    () => Promise<void>;
    onClose:   () => void;
    isEditing: boolean;
    loading:   boolean;
}

const ListenModal: React.FC<ListenModalProps> = ({
                                                     form, setForm, diagramFiles, onDiagramFileChange, onSave, onClose, isEditing, loading,
                                                 }) => {
    const [activeTab, setActiveTab] = useState<TabId>("info");

    // ── Audio local state ──────────────────────────────────────────────────────
    // audioFile: the File object for newly picked/recorded audio (null if untouched on edit)
    // previewUrl: a blob URL for AudioPreview — must be revoked on change/unmount
    const [audioFile, setAudioFile]     = useState<File | null>(
        form.audio_url instanceof File ? form.audio_url : null,
    );
    const [previewUrl, setPreviewUrl]   = useState<string | null>(
        // On edit, seed preview with the existing URL string so AudioPreview shows immediately
        typeof form.audio_url === "string" && form.audio_url
            ? form.audio_url
            : null,
    );
    const [playing, setPlaying]         = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const { recording, duration: recordingDuration, start: startRecording, stop: stopRecording } = useRecorder();

    // Revoke blob URLs when they change to prevent memory leaks
    // (Don't revoke existing server URLs — those are just strings, not blobs)
    useEffect(() => {
        return () => {
            if (previewUrl?.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFile = useCallback((file: File) => {
        // Revoke previous blob if any
        if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        const url = URL.createObjectURL(file);
        setAudioFile(file);
        setPreviewUrl(url);
        setPlaying(false);
        setAudioDuration(0);
        // Write File into form so handleSave in ListenManager can read it
        setForm(prev => ({ ...prev, audio_url: file }));
    }, [previewUrl, setForm]);

    const handleRemoveAudio = useCallback(() => {
        if (previewUrl?.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setAudioFile(null);
        setPreviewUrl(null);
        setPlaying(false);
        setAudioDuration(0);
        setForm(prev => ({ ...prev, audio_url: "" }));
    }, [previewUrl, setForm]);

    const handleTogglePlay = useCallback(() => {
        const el = audioRef.current;
        if (!el) return;
        if (playing) {
            el.pause();
            setPlaying(false);
        } else {
            el.play().catch(() => setPlaying(false));
            setPlaying(true);
        }
    }, [playing]);

    const handleRecord = useCallback(async () => {
        if (recording) {
            const file = await stopRecording();
            handleFile(file);
        } else {
            await startRecording();
        }
    }, [recording, startRecording, stopRecording, handleFile]);

    // Detect duration once preview is available and audio metadata loads
    const handleAudioMetadata = useCallback(() => {
        const el = audioRef.current;
        if (el && isFinite(el.duration)) {
            setAudioDuration(Math.round(el.duration));
        }
    }, []);

    // ── Form helpers ───────────────────────────────────────────────────────────
    const update = useCallback(
        <K extends keyof ListenForm>(key: K, value: ListenForm[K]) =>
            setForm(prev => ({ ...prev, [key]: value })),
        [setForm],
    );

    const updateSettings = useCallback(
        <K extends keyof NonNullable<ListenForm["settings"]>>(key: K, value: NonNullable<ListenForm["settings"]>[K]) =>
            setForm(prev => ({ ...prev, settings: ({ ...(prev.settings ?? {}), [key]: value } as ListenForm["settings"]) })),
        [setForm],
    );


    const updateMeta = useCallback(
        (key: keyof NonNullable<ListenForm["metadata"]>, value: unknown) =>
            setForm((prev) => ({
            ...prev,
            metadata: {
                ...prev.metadata,
                [key]: value,
            } as NonNullable<ListenForm["metadata"]>, // Explicitly cast the metadata object
            })),
        [setForm]
    );

    const updateAccess = useCallback(
        <K extends keyof NonNullable<ListenForm["access"]>>(key: K, value: NonNullable<ListenForm["access"]>[K]) =>
            setForm(prev => ({ ...prev, access: ({ ...(prev.access ?? {}), [key]: value } as ListenForm["access"]) })),
        [setForm],
    );

    const addPassage = useCallback(() => {
        if (form.passages.length >= LIMITS.PASSAGES_MAX) return;
        setForm(prev => ({
            ...prev,
            passages: [...prev.passages, emptyPassage(prev.passages.length + 1)],
        }));
    }, [form.passages.length, setForm]);

    const removePassage = useCallback((si: number) =>
            setForm(prev => ({ ...prev, passages: prev.passages.filter((_, i) => i !== si) })),
        [setForm],
    );

    const changePassage = useCallback(
        <K extends keyof Passage>(si: number, field: K, value: Passage[K]) =>
            setForm(prev => ({
                ...prev,
                passages: prev.passages.map((s, i) => i === si ? { ...s, [field]: value } : s),
            })),
        [setForm],
    );

    const addQuestion = useCallback((si: number) =>
            setForm(prev => {
                const passages  = [...prev.passages];
                const questions = [...passages[si].questions, emptyAnswer()];
                passages[si]    = { ...passages[si], questions };
                return { ...prev, passages };
            }),
        [setForm],
    );

    const removeQuestion = useCallback((si: number, qi: number) =>
            setForm(prev => {
                const passages  = [...prev.passages];
                const questions = passages[si].questions.filter((_, i) => i !== qi);
                passages[si]    = { ...passages[si], questions };
                return { ...prev, passages };
            }),
        [setForm],
    );

    const changeQuestion = useCallback((si: number, qi: number, updated: Answer) =>
            setForm(prev => {
                const passages  = [...prev.passages];
                const questions = passages[si].questions.map((a, i) => i === qi ? updated : a);
                passages[si]    = { ...passages[si], questions };
                return { ...prev, passages };
            }),
        [setForm],
    );

    const totalQuestions = React.useMemo(
        () => form.passages.reduce(
            (sum, p) => sum + p.questions.reduce((qs, a) => qs + a.formBody.length, 0),
            0,
        ),
        [form.passages],
    );

    React.useEffect(() => {
        setForm(prev => syncTotalQuestions(prev));
    }, [totalQuestions, setForm]);

    const transcriptOk = form.transcript.length >= LIMITS.TRANSCRIPT_MIN;
    const isFormValid = 
        form.title.trim().length > 0 && 
        transcriptOk && 
        totalQuestions > 0;
    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
                aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isEditing ? "Edit Listening Test" : "Create Listening Test"}
                    className="w-full max-w-7xl pointer-events-auto flex flex-col rounded-2xl
                               overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl"
                    style={{ maxHeight: "95dvh", height: "780px" }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-3.5
                                    border-b border-slate-800 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
                                            flex items-center justify-center">
                                {isEditing
                                    ? <Pencil size={14} className="text-indigo-400" />
                                    : <BookOpen size={14} className="text-indigo-400" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-100">
                                    {isEditing ? "Edit listening test" : "New listening test"}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                    {form.passages.length} passage{form.passages.length !== 1 ? "s" : ""}
                                    {" · "}
                                    {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
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

                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 bg-slate-900 shrink-0 px-1">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-4 py-3 text-xs font-bold uppercase tracking-wider
                                            transition-all border-b-2 ${activeTab === tab.id
                                    ? "border-indigo-500 text-indigo-400"
                                    : "border-transparent text-slate-500 hover:text-slate-300"}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-hidden flex flex-col">

                        {/* ── Test info ── */}
                        {activeTab === "info" && (
                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                <SectionSimple title="Test info" subtitle="General information about the listening test" icon={<FileText size={20} className="text-indigo-400" />}>
                                    <div className="w-full flex flex-1 justify-between">
                                        <Field label="Title" htmlFor="form.title" required>
                                            <Input
                                                type="text"
                                                placeholder="e.g. City Planning Podcast"
                                                value={form.title}
                                                onChange={e => update("title", e.target.value)}
                                                disabled={loading}
                                            />
                                        </Field>

                                        {/* Status */}
                                        <Field label="Status" htmlFor="form-status">
                                            <Select
                                                value={form.status}
                                                onChange={e => update("status", e.target.value as Status)}
                                                disabled={loading}
                                            >
                                                {STATUSES.map(s => (
                                                    <option key={s} value={s}>
                                                        {s.charAt(0).toUpperCase() + s.slice(1)}
                                                    </option>
                                                ))}
                                            </Select>
                                        </Field>
                                    </div>
                                    <Field label="Description" htmlFor="form.description">
                                        <Textarea
                                            rows={3}
                                            placeholder="Brief description of this listening test…"
                                            value={form.description}
                                            onChange={e => update("description", e.target.value)}
                                            disabled={loading}
                                        />
                                    </Field>

                                </SectionSimple>
                            </div>
                        )}

                        {/* ── Transcript + Audio ── */}
                        {activeTab === "passage" && (
                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

                                {/* Transcript */}
                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <Label>
                                            Listening transcript <span className="text-rose-500">*</span>
                                        </Label>
                                        <span className={`text-[10px] font-bold ${
                                            transcriptOk ? "text-emerald-500" : "text-rose-500"
                                        }`}>
                                            {form.transcript.length} / {LIMITS.TRANSCRIPT_MIN} min chars
                                        </span>
                                    </div>
                                    <Textarea
                                        rows={10}
                                        placeholder="Paste or write the full listening transcript here (minimum 500 characters)…"
                                        value={form.transcript}
                                        onChange={e => update("transcript", e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                {/* Audio — hidden audio element to read duration */}
                                <audio
                                    ref={audioRef}
                                    src={previewUrl ?? undefined}
                                    onLoadedMetadata={handleAudioMetadata}
                                    onEnded={() => setPlaying(false)}
                                    className="hidden"
                                />

                                <div>
                                    <Label >
                                        Audio file <span className="text-rose-500">*</span>
                                        {isEditing && typeof form.audio_url === "string" && form.audio_url && !audioFile && (
                                            <span className="ml-2 normal-case font-normal text-emerald-500/70">
                                                (existing audio — upload a new file to replace)
                                            </span>
                                        )}
                                    </Label>

                                    {/* Show preview card when we have a file OR an existing URL */}
                                    {(audioFile || (typeof form.audio_url === "string" && form.audio_url)) ? (
                                        <AudioPreview
                                            file={
                                                audioFile ?? new File(
                                                    [],
                                                    // Display the filename portion of the URL as the name
                                                    (form.audio_url as string).split("/").pop() ?? "audio",
                                                    { type: "audio/mpeg" },
                                                )
                                            }
                                            preview={previewUrl}
                                            playing={playing}
                                            duration={audioDuration}
                                            onPlay={handleTogglePlay}
                                            onRemove={handleRemoveAudio}
                                            audioRef={audioRef}
                                        />
                                    ) : (
                                        <UploadZone
                                            audioFile={audioFile}
                                            recording={recording}
                                            onFile={handleFile}
                                            onRecord={handleRecord}
                                            recordingDuration={recordingDuration}
                                            loading={loading}
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Settings ── */}
                        {activeTab === "settings" && (
                            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 min-w-full">
                                
                            <Menu title="Metadata" subtitle="Write test metadata">
                                <Field label="Duration (min)" htmlFor="meta-estimatedDuration">
                                    <Input
                                        id="meta-estimatedDuration"
                                        type="number"
                                                    min={LIMITS.DURATION_MIN}
                                                                    max={LIMITS.DURATION_MAX}
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
                            
                                                            <Field label="Time Limit (Seconds)" htmlFor="settings-timeLimitSec" required>
                                                                <Input
                                                                    id="settings-timeLimitSec"
                                                                    type="number"
                                                                    value={form.settings?.timeLimitSec ?? ''}
                                                                    onChange={e => updateSettings('timeLimitSec', Number(e.target.value))}
                                                                    disabled={loading}
                                                                />
                                                            </Field>
                            
                                                            <Field label="Max Attempts" htmlFor="settings-maxAttempts" required>
                                                                <Input
                                                                    id="settings-maxAttempts"
                                                                    type="number"
                                                                    value={form.settings?.maxAttempts ?? ''}
                                                                    onChange={e => updateSettings('maxAttempts', Number(e.target.value))}
                                                                    disabled={loading}
                                                                />
                                                            </Field>
                            
                                                            <Field label="Passing Score" htmlFor="settings-passingScore" required>
                                                                <Input
                                                                    id="settings-passingScore"
                                                                    type="number"
                                                                    value={form.settings?.passingScore ?? ''}
                                                                    onChange={e => updateSettings('passingScore', Number(e.target.value))}
                                                                    disabled={loading}
                                                                />
                                                            </Field>
                            
                                                            <Field label="Passing Band" htmlFor="settings-passingBand" hint={'max: 9.0'} required>
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
                                                                    onChange={e => {
                                                                        const isFree = e.target.checked;
                                                                        setForm(prev => ({
                                                                            ...prev,
                                                                            access: {
                                                                                ...(prev.access ?? {}),
                                                                                isFree,
                                                                                price: isFree ? 0 : prev.access?.price,
                                                                            } as ListenForm["access"],
                                                                        }));
                                                                    }}
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
                                
                            </div>
                        )}

                        {/* ── Passages & questions ── */}
                        {activeTab === "passages" && (
                            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlignLeft size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            Passages
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800
                                                         text-[10px] font-bold text-slate-500">
                                            {form.passages.length}/{LIMITS.PASSAGES_MAX}
                                        </span>
                                    </div>
                                    {form.passages.length < LIMITS.PASSAGES_MAX && (
                                        <button
                                            type="button"
                                            onClick={addPassage}
                                            disabled={loading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                                       text-[11px] font-bold bg-emerald-500/10
                                                       border border-emerald-500/20 text-emerald-400
                                                       hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                                        >
                                            <Plus size={11} /> Add passage
                                        </button>
                                    )}
                                </div>

                                {form.passages.map((passage, si) => (
                                    <PassagePanel
                                        key={si}
                                        passage={passage}
                                        si={si}
                                        canDelete={form.passages.length > 1}
                                        disabled={loading}
                                        onChange={(field, value) => changePassage(si, field, value)}
                                        onDelete={() => removePassage(si)}
                                        onAddQuestion={() => addQuestion(si)}
                                        onRemoveQuestion={qi => removeQuestion(si, qi)}
                                        onQuestionChange={(qi, updated) => changeQuestion(si, qi, updated)}
                                        // NEW — diagram wiring, index-aligned to the row position
                                        diagramFiles={diagramFiles}
                                        onDiagramFileChange={onDiagramFileChange}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2.5 px-5 py-3.5
                                    border-t border-slate-800 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-4">
                            {form.transcript.length > 0 && !transcriptOk && (
                                <span className="text-[11px] text-rose-400 font-medium">
                                    Transcript too short ({form.transcript.length}/{LIMITS.TRANSCRIPT_MIN} chars)
                                </span>
                            )}
                            {form.passages.length > 0 && (
                                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                                    Total questions:{" "}
                                    <span className={`font-bold ${
                                        totalQuestions === 40 ? "text-lime-500" : "text-rose-400"
                                    }`}>
                                        {totalQuestions}
                                    </span>
                                    {" "}/40
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                label="Cancel"
                                variant="ghost"
                                onClick={onClose}
                                disabled={loading}
                            />
                            <Button
                                label={isEditing ? "Update test" : "Create test"}
                                variant="save"
                                onClick={onSave}
                                disabled={loading || !isFormValid}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ListenModal;