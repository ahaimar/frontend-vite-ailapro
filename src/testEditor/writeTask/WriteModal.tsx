

import React, { useCallback, useRef } from "react";
import {
    Pencil, Plus, X,
    Trash2, ChevronDown, FileText, Settings2, AlignLeft,
    ImageIcon,
} from "lucide-react";
import {
    type WriteForm,
    type TaskAttempt,
    type TaskType,
    TASK_TYPE_LABELS,
    TASK_TYPE_GROUPS,
    LIMITS,
    emptyTask,
} from "./writeDTO.ts";
import { Button, Field, Input, Menu, SectionSimple, Select, Textarea } from "../../ui/UI.tsx";
import { LEVELS, MET_TYPE, STATUSES, TIERS, VISIBILITYS, type Level, type Status, type Tier, type Visibility, type WriteTestType } from "../index.ts";


const sectionHeader = (color = "from-indigo-500 to-violet-500") =>
    `h-px bg-gradient-to-r ${color} mb-4`;

// ─── TaskEditor ───────────────────────────────────────────────────────────────

interface TaskEditorProps {
    task:     TaskAttempt;
    index:    number;
    total:    number;
    disabled: boolean;
    file:     File | null;                        // NEW
    onFileChange: (file: File | null) => void;     // NEW
    onChange: (updated: TaskAttempt) => void;
    onDelete: () => void;
}

const TaskEditor: React.FC<TaskEditorProps> = ({
    task, index, total, disabled, file, onFileChange, onChange, onDelete,
}) => {
    const set = <K extends keyof TaskAttempt>(field: K, value: TaskAttempt[K]) =>
        onChange({ ...task, [field]: value });

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Local object URL for a newly-picked (not-yet-uploaded) file
    const [localPreview, setLocalPreview] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!file) { setLocalPreview(null); return; }
        const url = URL.createObjectURL(file);
        setLocalPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const picked = e.target.files?.[0] ?? null;
        if (picked && !picked.type.startsWith("image/")) {
            e.target.value = "";
            return; // could surface a toast/error state here
        }
        onFileChange(picked);
        e.target.value = "";
    };

    const clearImage = () => {
        onFileChange(null);
        set("diagram_url", "");        // also clear the existing server URL, if any
        set("diagram_public_id", null);
    };

    const previewSrc = localPreview ?? task.diagram_url ?? "";
    const missingType     = !task.taskType;
    const missingQuestion = !task.question.trim();

    return (
        <div className={`border rounded-2xl overflow-hidden transition-colors
            ${missingType || missingQuestion
            ? "border-amber-600/40"
            : "border-slate-800"}`}>

            {/* Task header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80">
                <span className="w-6 h-6 rounded-full bg-indigo-600/20 border border-indigo-500/30
                                 flex items-center justify-center text-[10px] font-bold text-indigo-300 shrink-0">
                    {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-200">
                        Task {index + 1}
                        {task.taskType && (
                            <span className="ml-2 font-normal text-slate-500">
                                — {TASK_TYPE_LABELS[task.taskType]}
                            </span>
                        )}
                    </p>
                    {(missingType || missingQuestion) && (
                        <p className="text-[10px] text-amber-400 mt-0.5">
                            {missingType ? "Task type required" : "Question prompt required"}
                        </p>
                    )}
                </div>
                {total > 1 && (
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={disabled}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400
                                   hover:bg-rose-500/10 transition-all disabled:opacity-40"
                        aria-label={`Remove task ${index + 1}`}
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>

            {/* Task body */}
            <div className="p-4 space-y-4 bg-slate-950/20">

                <Menu title="Task details" subtitle="Task configuration and content">
                    
                    {/* Title */}
                    <Field label="Task title" htmlFor="task-title" required>
                        <Input
                            type="text"
                            value={task.title}
                            onChange={e => set("title", e.target.value)}
                            placeholder="e.g. The chart below shows…"
                            disabled={disabled}
                            
                        />
                    </Field>

                    {/* Task type */}
                    <Field label="Task type" htmlFor="task-taskType" required>
                        <div className="relative">
                            <Select
                                value={task.taskType ?? ""}
                                onChange={e => set("taskType", (e.target.value as TaskType) || null)}
                                disabled={disabled}
                            >
                                <option value="">Select a task type…</option>
                                {TASK_TYPE_GROUPS.map(group => (
                                    <optgroup key={group.label} label={group.label}>
                                        {group.types.map(t => (
                                            <option key={t} value={t}>{TASK_TYPE_LABELS[t]}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </Select>
                            <ChevronDown
                                size={13}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                            />
                        </div>
                    </Field>

                    {/* Title */}
                    <Field label="Task title" htmlFor="task-timeTakenSec" required>
                        <Input
                            id="task-timeTakenSec"
                            type="number"
                            value={task.timeTakenSec}
                            onChange={e => set('timeTakenSec', Number(e.target.value))}
                            placeholder="max 60.0 seconds"
                            disabled={disabled}
                        />
                    </Field>

                    {/* Description */}
                    <Field label="Description" htmlFor="task-description">
                        <span className="normal-case font-normal text-slate-600">(context above prompt)</span>
                        <Textarea
                            rows={2}
                            value={task.description}
                            onChange={e => set("description", e.target.value)}
                            placeholder="Brief context shown to the candidate…"
                            disabled={disabled}
                        />
                    </Field>
                </Menu>

                {/* Question prompt */}
                <Field label="Question prompt " htmlFor="task-question" required>
                    <Textarea
                        rows={4}
                        value={task.question}
                        onChange={e => set("question", e.target.value)}
                        placeholder="The full question text the candidate must respond to…"
                        disabled={disabled}
                    />
                </Field>

{/* Diagram / image upload */}
{(task?.taskType === 'map_description' || task?.taskType === 'graph_description') && (
    <Field label="Diagram / image" htmlFor="task-diagram">
        {previewSrc ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                <img
                    src={previewSrc}
                    alt="Task diagram"
                    className="w-full max-h-56 object-contain bg-slate-950"
                />
                <button
                    type="button"
                    onClick={clearImage}
                    disabled={disabled}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80
                            text-slate-300 hover:text-rose-400 hover:bg-rose-500/10
                            transition-all disabled:opacity-40"
                    aria-label="Remove diagram image"
                >
                    <X size={13} />
                </button>
                {localPreview && (
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded
                                    bg-indigo-500/80 text-[10px] font-bold text-white">
                        New — uploads on save
                    </span>
                )}
            </div>
        ) : (
            <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                variant="ghost"
            >
                <ImageIcon size={18} />
                <span className="text-xs">Click to upload an image</span>
                <span className="text-[10px] text-slate-600">PNG, JPG, WEBP up to 5MB</span>
            </Button>
        )}

        <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
        />
    </Field>
)}
                

                {/* Word limits */}
                <div className="grid grid-cols-2 gap-3">
                    <Field label="Min words" htmlFor="task-wordCount">
                        <Input
                            type="number" min={0}
                            value={task.wordCount}
                            onChange={e => set("wordCount", Number(e.target.value))}
                            disabled={disabled}
                            
                        />
                    </Field>
                    <Field label="Max words" htmlFor="task-wordMax">
                        <Input
                            type="number" min={1}
                            value={task.wordMax}
                            onChange={e => set("wordMax", Number(e.target.value))}
                            disabled={disabled}
                            
                        />
                    </Field>
                </div>
            </div>
        </div>
    );
};

// ─── WriteModal ───────────────────────────────────────────────────────────────

interface WriteModalProps {
    form:      WriteForm;
    setForm:   React.Dispatch<React.SetStateAction<WriteForm>>;
    taskFiles: (File | null)[];
    onTaskFileChange:     (index: number, file: File | null) => void;
    onAddTaskFileSlot:    () => void;
    onRemoveTaskFileSlot: (index: number) => void;
    onSave:    () => Promise<void>;
    onClose:   () => void;
    isEditing: boolean;
    loading:   boolean;
}


export const WriteModal: React.FC<WriteModalProps> = ({
    form, setForm, taskFiles, onTaskFileChange, onAddTaskFileSlot, onRemoveTaskFileSlot,
    onSave, onClose, isEditing, loading,
}) => {

    // ── Generic updaters ──────────────────────────────────────────────────────

    const update = useCallback(
        <K extends keyof WriteForm>(key: K, value: WriteForm[K]) =>
            setForm(prev => ({ ...prev, [key]: value })),
        [setForm],
    );

    const updateMeta = useCallback(
        <K extends keyof NonNullable<WriteForm["metadata"]>>(key: K, value: NonNullable<WriteForm["metadata"]>[K]) =>
            setForm(prev => ({ ...prev, metadata: ({ ...(prev.metadata ?? {}), [key]: value } as WriteForm["metadata"]) })),
        [setForm],
    );

    const updateSettings = useCallback(
        <K extends keyof NonNullable<WriteForm["settings"]>>(key: K, value: NonNullable<WriteForm["settings"]>[K]) =>
            setForm(prev => ({ ...prev, settings: ({ ...(prev.settings ?? {}), [key]: value } as WriteForm["settings"]) })),
        [setForm],
    );

    const updateAccess = useCallback(
        <K extends keyof NonNullable<WriteForm["access"]>>(key: K, value: NonNullable<WriteForm["access"]>[K]) =>
            setForm(prev => ({ ...prev, access: ({ ...(prev.access ?? {}), [key]: value } as WriteForm["access"]) })),
        [setForm],
    );

    // ─────────────────────────────────────────────────────────────────────────
    const addTask = useCallback(() => {
        if (form.tasks.length >= LIMITS.TASKS_MAX) return;
        setForm(prev => ({ ...prev, tasks: [...prev.tasks, emptyTask(prev.tasks.length)] }));
        onAddTaskFileSlot();
    }, [form.tasks.length, setForm, onAddTaskFileSlot]);

    const removeTask = useCallback((ti: number) => {
        setForm(prev => ({ ...prev, tasks: prev.tasks.filter((_, i) => i !== ti) }));
        onRemoveTaskFileSlot(ti);
    }, [setForm, onRemoveTaskFileSlot]);

    const changeTask = useCallback((ti: number, updated: TaskAttempt) =>
            setForm(prev => ({ ...prev, tasks: prev.tasks.map((t, i) => (i === ti ? updated : t)) })),
        [setForm]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isEditing ? "Edit Writing Test" : "Create Writing Test"}
                    className="w-full max-w-7xl pointer-events-auto flex flex-col rounded-2xl
                               overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl"
                    style={{ maxHeight: "92dvh" }}
                >

                    {/* ── Header ── */}
                    <div className="flex items-center justify-between px-6 py-4
                                    border-b border-slate-800 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30
                                            flex items-center justify-center">
                                {isEditing
                                    ? <Pencil size={14} className="text-indigo-400" />
                                    : <Plus   size={14} className="text-indigo-400" />}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-slate-100">
                                    {isEditing ? "Edit writing test" : "New writing test"}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                    {form.tasks.length} task{form.tasks.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                        <Button
                            icon={ <X size={16} /> }
                            variant={'reset'}
                            onClick={onClose}
                            loading={loading}
                            aria-label="Close dialog"
                        />

                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">

                        {/* ── Section: Test info ── */}
                        <SectionSimple title="Test info" icon={<FileText size={20} className="text-indigo-400" />}>
                            
                            <div className={sectionHeader()} />
                            <div className="flex flex-1 w-full justify-between">
                                {/* Title */}
                                <Field label="Title" htmlFor="form-title" required>
                                    <Input
                                        type="text"
                                        value={form.title}
                                        onChange={e => update("title", e.target.value)}
                                        placeholder="e.g. Academic Mock Test — Set A"
                                        disabled={loading}
                                    />
                                    {form.title.length > 0 && form.title.length < LIMITS.TITLE_MIN && (
                                        <p className="text-[10px] text-rose-400 mt-1">
                                            Minimum {LIMITS.TITLE_MIN} characters
                                        </p>
                                    )}
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

                            {/* Description */}
                            <Field label="Description" htmlFor="form-description">
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[10px] font-bold ${
                                        form.description.length > LIMITS.DESC_MAX
                                            ? "text-rose-400"
                                            : "text-slate-600"
                                    }`}>
                                        {form.description.length}/{LIMITS.DESC_MAX}
                                    </span>
                                </div>
                                <Textarea
                                    rows={5}
                                    value={form.description}
                                    onChange={e => update("description", e.target.value)}
                                    maxLength={LIMITS.DESC_MAX}
                                    placeholder="Brief description of this writing test…"
                                    disabled={loading}
                                />
                            </Field>

                        </SectionSimple>

                        {/* ── Section: Configuration ── */}
                        <section className="px-6 py-5 space-y-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Settings2 size={12} className="text-violet-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Configuration
                                </span>
                            </div>
                            <div className={sectionHeader("from-violet-500 to-fuchsia-500")} />
                            {/**
                             *              siting handling 
                             * 
                             */}
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

                                <Field label="Passing Band" htmlFor="settings-passingBand" required>
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
                                        <option value="">Select Tier</option>
                                        {VISIBILITYS.map(t => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </Select>
                                </Field>
                            </Menu>
                            
                        </section>

                        {/* ── Section: Tasks ── */}
                        <section className="px-6 py-5 space-y-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <AlignLeft size={12} className="text-emerald-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                        Tasks
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-slate-800
                                                     text-[10px] font-bold text-slate-500">
                                        {form.tasks.length}/{LIMITS.TASKS_MAX}
                                    </span>
                                </div>
                                {form.tasks.length < LIMITS.TASKS_MAX && (
                                    <Button
                                        onClick={addTask}
                                        variant="outline"
                                        size="sm"
                                        disabled={loading}
                                        label="Add task"
                                        icon={<Plus size={11} />}
                                    />
                                )}
                            </div>
                            <div className={sectionHeader("from-emerald-500 to-teal-400")} />

                            <div className="space-y-4">
                                {form.tasks.map((task, ti) => (
                                    <TaskEditor
                                        key={ti}
                                        task={task}
                                        index={ti}
                                        total={form.tasks.length}
                                        disabled={loading}
                                        file={taskFiles[ti] ?? null}
                                        onFileChange={file => onTaskFileChange(ti, file)}
                                        onChange={updated => changeTask(ti, updated)}
                                        onDelete={() => removeTask(ti)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* ── Footer — inside the dialog div ── */}
                    <div className="flex items-center justify-between gap-2.5 px-6 py-4
                                    border-t border-slate-800 bg-slate-900 shrink-0">
                        {/* Inline error hint */}
                        <span className="text-[11px] text-slate-600">
                            {form.tasks.some(t => !t.taskType || !t.question.trim())
                                ? <span className="text-amber-400">Some tasks are incomplete</span>
                                : null}
                        </span>

                        <div className="flex items-center gap-2">
                            <Button
                                label="Cancel"
                                variant="ghost"
                                onClick={onClose}
                                loading={loading}
                            />
                            <Button
                                variant="save"
                                onClick={onSave}
                                loading={loading}
                                label={isEditing ? "Update test" : "Create test"}
                                icon={isEditing ? <Pencil size={13} /> : <Plus size={13} />}
                            />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};