import { ChevronDown, Clock, Grid2x2Plus, Mic, MicOff, Pause, Play, Plus, Trash2, Upload, Volume2, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import {
    EMPTY_FORM_BODY,
    LIMITS,
    QUESTION_TYPE_LABELS,
    QUESTION_TYPES,
    type Answer,
    type FormBody,
    type ListenForm,
    type Passage,
    TABS,
    type QuestionType,
    type TableProp
} from "./listenDTO";
import type { DiagramFileMap } from "./ListenManager";
import { Button, Field, Input, Menu, Select } from "../../ui/UI";
import { TablePropEditor } from "../exament/AiGenerator/TablePrp";



interface AudioPreviewProps {
    file: File | null;
    preview: string | null;
    playing: boolean;
    duration: number;
    onPlay: () => void;
    onRemove: () => void;
    audioRef: React.RefObject<HTMLAudioElement | null>
}

export const AudioPreview: React.FC<AudioPreviewProps> = ({
                                                              file,
                                                              preview,
                                                              playing,
                                                              duration,
                                                              onPlay,
                                                              onRemove,
                                                              audioRef,
                                                          }) => {
    if (!file || !preview) return null;
    return (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-emerald-300 truncate">{file.name}</p>
                    <p className="text-xs text-emerald-400/70">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                </div>
            </div>

            {/* Playback controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <button
                    type="button"
                    onClick={onPlay}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20
                     border border-emerald-500/40 hover:border-emerald-500/60
                     text-emerald-300 hover:text-emerald-200 text-xs font-medium
                     transition-all active:scale-95"
                >
                    {playing
                        ? ( <> <Pause className="w-4 h-4" /> Pause </> )
                        : ( <> <Play className="w-4 h-4" /> Play </> )
                    }
                </button>

                {duration > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white/60">
                        <Clock className="w-4 h-4" />
                        {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
                    </div>
                )}

                <button
                    type="button"
                    onClick={onRemove}
                    className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg
                     border border-rose-500/20 hover:border-rose-500/40
                     text-rose-400/70 hover:text-rose-300 text-xs font-medium
                     transition-all active:scale-95"
                >
                    <Trash2 className="w-4 h-4" /> Remove
                </button>
            </div>

            <audio
                ref={audioRef}
                src={preview}
                onEnded={() => {}}
                className="hidden"
            />
        </div>
    );
};

// ─── UploadZone ───────────────────────────────────────────────────────────

interface UploadZoneProps {
    audioFile: File | null;
    recording: boolean;
    onFile: (file: File) => void;
    onRecord: () => void;
    recordingDuration: number;
    loading: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
                                                          audioFile,
                                                          recording,
                                                          onFile,
                                                          onRecord,
                                                          recordingDuration,
                                                          loading,
                                                      }) => {
    const fileRef = useRef<HTMLInputElement>(null);

    if (audioFile) return null;

    return (
        <div className="space-y-4">
            {/* Upload area */}
            <div
                className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-xl border-2 border-dashed p-8 text-center cursor-pointer
          transition-all duration-200
          ${recording ? "border-rose-500/40 bg-rose-500/5" : "border-indigo-500/30 hover:border-indigo-500/50 hover:bg-indigo-500/5"}
        `}
                onClick={() => !recording && fileRef.current?.click()}
                onDragOver={(e) => !recording && e.preventDefault()}
                onDrop={(e) => {
                    if (recording) return;
                    e.preventDefault();
                    const f = e.dataTransfer.files[0];
                    if (f && f.type.startsWith("audio/")) onFile(f);
                }}
            >
                <input
                    ref={fileRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onFile(f);
                    }}
                    disabled={loading || recording}
                />

                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors
          ${recording ? "bg-rose-500/15" : "bg-indigo-500/15"}`}>
                    {recording ? (
                        <Mic className="w-6 h-6 text-rose-400 animate-pulse" />
                    ) : (
                        <Upload className="w-5 h-5 text-indigo-400" />
                    )}
                </div>

                {recording ? (
                    <div>
                        <p className="text-sm font-semibold text-rose-300">Recording...</p>
                        <p className="text-xs text-rose-400/70 mt-0.5">
                            {Math.floor(recordingDuration / 60)}:{String(recordingDuration % 60).padStart(2, "0")}
                        </p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-medium">Drop audio here or click to browse</p>
                        <p className="text-xs text-white/40 mt-0.5">MP3, WAV, WEBM, OGG supported</p>
                    </div>
                )}
            </div>

            {/* Record button */}
            <button
                type="button"
                onClick={onRecord}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
          font-semibold text-sm transition-all active:scale-95
          ${
                    recording
                        ? "bg-rose-600 hover:bg-rose-600/80 text-white"
                        : "bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300"
                }
        `}
            >
                {recording ? (
                    <>
                        <MicOff className="w-4 h-4" /> Stop Recording
                    </>
                ) : (
                    <>
                        <Mic className="w-4 h-4" /> Record Audio
                    </>
                )}
            </button>
        </div>
    );
};

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */

// FIX: was "map_labelling " (trailing space) — removed
const OPTION_BASED_TYPES = new Set<string>([
    "mcq", "form_completion", "map_labelling",
    "matching", "table",
]);

export type TabId = typeof TABS[number]["id"];

const PASSAGE_ACCENTS = [
    { border: "border-l-indigo-500", pill: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    { border: "border-l-teal-500",   pill: "bg-teal-500/10   text-teal-400   border-teal-500/20"   },
    { border: "border-l-amber-500",  pill: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
    { border: "border-l-rose-500",   pill: "bg-rose-500/10   text-rose-400   border-rose-500/20"   },
] as const;

export const inp = `w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100
    placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
    focus:border-indigo-500/50 transition-all disabled:opacity-50`;

export const lbl = `text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block`;

/* ─────────────────────────────────────────────
   FormBodyRow
───────────────────────────────────────────── */

interface FormBodyRowProps {
    index:          number;
    total:          number;
    row:            FormBody;
    needsOptions:   boolean;
    disabled:       boolean;
    pi:             number;
    qi:             number;
    ri:             number;
    diagramFiles:   DiagramFileMap;
    status:        QuestionType;
    onDiagramFileChange: (pi: number, qi: number, ri: number, file: File | null) => void;
    onChange:       (updated: FormBody) => void;
    onOptionChange: (oi: number, value: string) => void;
    onAddOption:    () => void;
    onRemoveOption: (oi: number) => void;
}

export const FormBodyRow: React.FC<FormBodyRowProps> = ({
                                                            index, total, row, needsOptions, disabled,
                                                            pi, qi, ri, diagramFiles, status, onDiagramFileChange,
                                                            onChange, onOptionChange, onAddOption, onRemoveOption,
                                                        }) => {

    const set = <K extends keyof FormBody>(field: K, value: FormBody[K]) =>
        onChange({ ...row, [field]: value });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingFile = diagramFiles[`${pi}_${qi}_${ri}`] ?? null;

    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const currentTableProp = row.tableProp || {
        rows: [],
        maxRows: 5,
        maxCols: 5
    };

    const handleTableChange = (updatedTableProp: TableProp) => {
        set("tableProp", updatedTableProp);
    };

    useEffect(() => {

        if (!pendingFile) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLocalPreview(null);
            return;
        }

        const url = URL.createObjectURL(pendingFile);

        setLocalPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingFile]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        if (file && !file.type.startsWith("image/")) {
            e.target.value = "";
            return;
        }
        onDiagramFileChange(pi, qi, ri, file);
        e.target.value = "";
    };

    const clearImage = () => {
        onDiagramFileChange(pi, qi, ri, null);
        onChange({ ...row, diagram_url: "", diagram_public_id: null });
    };

    const previewSrc = localPreview ?? row.diagram_url ?? "";

    return (
        <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/40">

            {total > 1 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Question {index + 1}
                </p>
            )}

            <div>
                <label className={lbl}>
                    Instructions <span className="normal-case font-normal text-slate-600">(optional)</span>
                </label>
                <input
                    type="text"
                    value={row.instructions}
                    onChange={e => set("instructions", e.target.value)}
                    placeholder="e.g. Choose the correct option"
                    disabled={disabled}
                    className={inp}
                />
            </div>

            <div>
                <label className={lbl}>
                    Question text <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    value={row.question}
                    onChange={e => set("question", e.target.value)}
                    placeholder={`Question ${index + 1}`}
                    disabled={disabled}
                    className={inp}
                />
            </div>

            {needsOptions && (
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className={lbl} style={{ marginBottom: 0 }}>
                            Answer options
                            <span className="ml-1.5 normal-case font-normal text-slate-600">
                                ({row.options.length}/{LIMITS.OPTIONS_MAX})
                            </span>
                        </label>
                        {row.options.length < LIMITS.OPTIONS_MAX && (
                            <button
                                type="button"
                                onClick={onAddOption}
                                disabled={disabled}
                                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300
                                           flex items-center gap-1 disabled:opacity-40"
                            >
                                <Plus size={10} /> Add option
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {row.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-600 w-4 shrink-0 text-right">
                                    {String.fromCharCode(65 + oi)}.
                                </span>
                                <input
                                    type="text"
                                    value={opt}
                                    onChange={e => onOptionChange(oi, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                                    disabled={disabled}
                                    className={`${inp} flex-1`}
                                />
                                {row.options.length > LIMITS.OPTIONS_MIN && (
                                    <button
                                        type="button"
                                        onClick={() => onRemoveOption(oi)}
                                        disabled={disabled}
                                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400
                                                   hover:bg-rose-500/10 transition-all disabled:opacity-40"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>
                        ))}
                        {row.options.length < LIMITS.OPTIONS_MIN && (
                            <p className="text-[10px] text-rose-500/80">
                                At least {LIMITS.OPTIONS_MIN} options required
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div>
                <label className={lbl}>
                    Correct answer <span className="text-rose-500">*</span>
                </label>
                <input
                    type="text"
                    value={row.correctAnswer}
                    onChange={e => set("correctAnswer", e.target.value)}
                    placeholder={needsOptions ? "e.g. A" : "Enter the correct answer"}
                    disabled={disabled}
                    className={inp}
                />
            </div>

            <div>
                <label className={lbl}>
                    Explanation <span className="normal-case font-normal text-slate-600">(optional)</span>
                </label>
                <textarea
                    rows={2}
                    value={row.explanation}
                    onChange={e => set("explanation", e.target.value)}
                    placeholder="Explain why this is the correct answer…"
                    disabled={disabled}
                    className={`${inp} resize-none`}
                />
            </div>

            

            {/**    this is a status on questio type schoule be handling in next time ... !! */}
            {
                status === 'map_labelling' && 
                    <Field label="Diagram / image" htmlFor="row.diagram" hint="create map or diagram is not optional" required>
                        {previewSrc ? (
                            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                                <img src={previewSrc} alt="Row diagram" className="w-full max-h-40 object-contain bg-slate-950" />
                                <Button
                                    onClick={clearImage}
                                    loading={disabled}
                                    variant="reset"
                                    icon={<X size={12} />}
                                />
                            </div>
                        ) : (
                            <Button
                                label="upload image"
                                onClick={() => fileInputRef.current?.click()}
                                loading={disabled}
                                variant="secondary"
                            />
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                    </Field>
            }

            {/**    this is a status on questio type schoule be handling in next time ... !! */}
            {
                status === 'table' && 
                <Field label="table" htmlFor="row.tableProp" hint="create table is not optional" required>
                    <Button
                        label="create table"
                        icon={<Grid2x2Plus />}
                        variant={"ghost"}
                        onClick={() => setIsOpen(true)}
                    />
                    {isOpen && (
                        <dialog open className="modal modal-open bg-black/40 transition-all backdrop-blur-sm">
                            <div className="modal-box w-11/12 max-w-5xl border border-base-300 shadow-2xl">
                                <div className="flex items-center justify-between mb-4 border-b pb-2">
                                    <h3 className="text-xl font-semibold text-base-content">
                                        Table Matrix Layout Editor
                                    </h3>
                                    <span className="text-xs badge badge-ghost font-mono">
                                        Max Matrix: {currentTableProp.maxRows}×{currentTableProp.maxCols}
                                    </span>
                                </div>

                                {/* Interactive Editor View Layout */}
                                <div className="py-2 overflow-x-auto min-h-75">
                                    <TablePropEditor
                                        value={currentTableProp}
                                        onChange={handleTableChange}
                                        maxCols={currentTableProp.maxCols}
                                        maxRows={currentTableProp.maxRows}
                                        label="Interactive Schema Matrix Builder"  
                                    />
                                </div>

                                    {/* Footer Control Actions Row */}
                                    <div className="modal-action border-t pt-3 mt-4">
                                        <Button 
                                            label="Save & Close"
                                            onClick={() => setIsOpen(false)}
                                        />
                                    </div>
                                </div>
                                
                                {/* Seamless Background Backdrop dismiss tap area */}
                                <div 
                                    className="modal-backdrop cursor-pointer" 
                                    onClick={() => setIsOpen(false)} 
                                />
                            </dialog>
                        )}
                </Field>
            }

            
        </div>
    );
};

/* ─────────────────────────────────────────────
   QuestionEditor
───────────────────────────────────────────── */

interface QuestionEditorProps {
    question:       Answer;
    qi:             number;
    pi:             number;
    disabled:       boolean;
    diagramFiles:   DiagramFileMap;
    onDiagramFileChange: (pi: number, qi: number, ri: number, file: File | null) => void;
    onChange:       (updated: Answer) => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
                                                                  question,
                                                                  qi,
                                                                  pi,
                                                                  disabled,
                                                                  diagramFiles,
                                                                  onDiagramFileChange,
                                                                  onChange,
                                                              }) => {
    const needsOptions = OPTION_BASED_TYPES.has(question.formType ?? "");

    const syncBodyToRange = (next: Answer["qusForm"], currentBody: FormBody[]): FormBody[] => {
        if (next.From == null || next.To == null || next.To < next.From) return currentBody;
        const count = next.To - next.From + 1;
        const body  = [...currentBody];
        while (body.length < count) body.push(EMPTY_FORM_BODY());
        return body.slice(0, count);
    };

    const handleRangeChange = (patch: Partial<Answer["qusForm"]>) => {
        const next = { ...question.qusForm, ...patch };
        onChange({ ...question, qusForm: next, formBody: syncBodyToRange(next, question.formBody) });
    };

    const handleTypeChange = (newType: Answer["formType"]) => {
        const stillNeedsOptions = OPTION_BASED_TYPES.has(newType ?? "");
        const nextBody = question.formBody.map(row => ({
            ...row,
            options: stillNeedsOptions
                ? (row.options.length ? row.options : ["", ""])
                : [],
        }));
        onChange({ ...question, formType: newType, formBody: nextBody });
    };

    const handleRowChange = (ri: number, updated: FormBody) => {
        const formBody = question.formBody.map((r, i) => (i === ri ? updated : r));
        onChange({ ...question, formBody });
    };

    const handleOptionChange = (ri: number, oi: number, value: string) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri) return r;
            return { ...r, options: r.options.map((o, j) => (j === oi ? value : o)) };
        });
        onChange({ ...question, formBody });
    };

    const handleAddOption = (ri: number) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri || r.options.length >= LIMITS.OPTIONS_MAX) return r;
            return { ...r, options: [...r.options, ""] };
        });
        onChange({ ...question, formBody });
    };

    const handleRemoveOption = (ri: number, oi: number) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri || r.options.length <= LIMITS.OPTIONS_MIN) return r;
            return { ...r, options: r.options.filter((_, j) => j !== oi) };
        });
        onChange({ ...question, formBody });
    };

    /*const expectedCount = (question.qusForm.From != null && question.qusForm.To != null &&
        question.qusForm.To >= question.qusForm.From)
        ? question.qusForm.To - question.qusForm.From + 1
        : question.formBody.length;*/

    const expectedCount = (question.qusForm?.From != null && question.qusForm?.To != null &&
        question.qusForm.To >= question.qusForm.From)
        ? question.qusForm.To - question.qusForm.From + 1
        : question.formBody.length;

    const mismatch = question.formBody.length !== expectedCount;

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Q# range + type */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={lbl}>Q# From</label>
                    <input
                        type="number" min={1} max={39} placeholder="1"
                        value={question.qusForm?.From ?? ""}
                        onChange={e => handleRangeChange({ From: e.target.value ? Number(e.target.value) : undefined })}
                        disabled={disabled}
                        className={inp}
                    />
                </div>
                <div>
                    <label className={lbl}>Q# To</label>
                    <input
                        type="number" min={1} max={40} placeholder="5"
                        value={question.qusForm?.To ?? ""}
                        onChange={e => handleRangeChange({ To: e.target.value ? Number(e.target.value) : undefined })}
                        disabled={disabled}
                        className={inp}
                    />
                </div>
                <div>
                    <label className={lbl}>Question type</label>
                    <select
                        value={question.formType ?? "mcq"}
                        onChange={e => handleTypeChange(e.target.value as Answer["formType"])}
                        disabled={disabled}
                        className={inp}
                    >
                        {QUESTION_TYPES.map(t => (
                            <option key={t} value={t}>{QUESTION_TYPE_LABELS[t]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Range info / sync */}
            {question.qusForm?.From != null && question.qusForm?.To != null && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium
                    ${mismatch
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                    : "bg-slate-800/60 border border-slate-800 text-slate-500"}`}>
                    <span>
                        Range Q{question.qusForm.From}–{question.qusForm.To}
                        {" · "}{expectedCount} question row{expectedCount !== 1 ? "s" : ""}
                    </span>
                    {mismatch && (
                        <button
                            type="button"
                            onClick={() => handleRangeChange({})}
                            disabled={disabled}
                            className="ml-auto underline text-amber-300 hover:text-amber-200 disabled:opacity-40"
                        >
                            Sync now
                        </button>
                    )}
                </div>
            )}

            {question.formBody.length === 0 ? (
                <p className="text-center py-8 text-[12px] text-slate-600 italic">
                    Set a Q# range above to generate question rows.
                </p>
            ) : (
                <div className="space-y-3">
                    {question.formBody.map((row, ri) => (
                        <FormBodyRow
                            key={ri}
                            index={ri}
                            total={question.formBody.length}
                            row={row}
                            pi={pi}
                            qi={qi}
                            ri={ri}
                            status={question.formType}
                            needsOptions={needsOptions}
                            disabled={disabled}
                            diagramFiles={diagramFiles}
                            onDiagramFileChange={onDiagramFileChange}
                            onChange={updated => handleRowChange(ri, updated)}
                            onOptionChange={(oi, val) => handleOptionChange(ri, oi, val)}
                            onAddOption={() => handleAddOption(ri)}
                            onRemoveOption={oi => handleRemoveOption(ri, oi)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

/* ─────────────────────────────────────────────
   QuestionListItem
───────────────────────────────────────────── */

interface QuestionListItemProps {
    question:  Answer;
    qi:        number;
    isActive:  boolean;
    canDelete: boolean;
    disabled:  boolean;
    onSelect:  () => void;
    onDelete:  () => void;
}

export const QuestionListItem: React.FC<QuestionListItemProps> = ({
                                                                      question, qi, isActive, canDelete, disabled, onSelect, onDelete,
                                                                  }) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={e => e.key === "Enter" && onSelect()}
        className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer
                    transition-all border ${isActive
            ? "bg-slate-800 border-slate-600"
            : "border-transparent hover:bg-slate-800/50"}`}
    >
        <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30
                         flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
            {qi + 1}
        </span>
        <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">
                {QUESTION_TYPE_LABELS[question.formType ?? "mcq"]}
            </p>
            <p className="text-[11px] text-slate-300 truncate mt-0.5">
                {question.formBody[0]?.question || <span className="italic text-slate-600">No question yet</span>}
            </p>
            {question.qusForm?.From != null && question.qusForm?.To != null && (
                <p className="text-[9px] text-slate-600 mt-0.5">
                    Q{question.qusForm.From}–{question.qusForm.To}
                    {" · "}{question.formBody.length} row{question.formBody.length !== 1 ? "s" : ""}
                </p>
            )}
        </div>
        {canDelete && (
            <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete(); }}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600
                           hover:text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-40"
                aria-label={`Delete question ${qi + 1}`}
            >
                <Trash2 size={11} />
            </button>
        )}
    </div>
);

/* ─────────────────────────────────────────────
   PassagePanel
───────────────────────────────────────────── */

interface PassagePanelProps {
    passage:          Passage;
    si:               number;
    canDelete:        boolean;
    disabled:         boolean;
    diagramFiles:        DiagramFileMap;
    onDiagramFileChange: (pi: number, qi: number, ri: number, file: File | null) => void;
    onChange:         <K extends keyof Passage>(field: K, value: Passage[K]) => void;
    onDelete:         () => void;
    onAddQuestion:    () => void;
    onRemoveQuestion: (qi: number) => void;
    onQuestionChange: (qi: number, updated: Answer) => void;
}

export const PassagePanel: React.FC<PassagePanelProps> = ({
                                                              passage, si, canDelete, disabled, diagramFiles, onDiagramFileChange,
                                                              onChange, onDelete, onAddQuestion, onRemoveQuestion, onQuestionChange,
                                                          }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [showMeta,  setShowMeta]  = useState(false);
    const [activeQ,   setActiveQ]   = useState(0);

    const accent = PASSAGE_ACCENTS[si % PASSAGE_ACCENTS.length];

    const handleAddQuestion = () => {
        onAddQuestion();
        setActiveQ(passage.questions.length);
    };

    const handleDeleteQuestion = (qi: number) => {
        onRemoveQuestion(qi);
        setActiveQ(q => Math.max(0, q >= qi ? q - 1 : q));
    };

    return (
        <div className={`border border-slate-800 rounded-2xl overflow-hidden border-l-2 ${accent.border}`}>

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-slate-900/80">
                <button
                    type="button"
                    onClick={() => setCollapsed(c => !c)}
                    className="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                    aria-label={collapsed ? "Expand" : "Collapse"}
                >
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${collapsed ? "" : "rotate-180"}`}
                    />
                </button>

                <span className={`text-[9px] font-bold uppercase tracking-widest shrink-0
                                  px-1.5 py-0.5 rounded border ${accent.pill}`}>
                    Part {passage.partNumber}
                </span>

                <span className="flex-1 min-w-0 text-sm font-semibold text-slate-200">
                    Part {passage.partNumber}
                </span>

                <span className="text-[10px] font-bold text-slate-600 shrink-0">
                    {passage.questions.length} form{passage.questions.length !== 1 ? "s" : ""}
                </span>

                <button
                    type="button"
                    onClick={() => setShowMeta(s => !s)}
                    className={`text-[10px] font-bold px-2 py-1 rounded border transition-all shrink-0
                        ${showMeta
                        ? "border-slate-600 text-slate-300 bg-slate-800"
                        : "border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700"}`}
                >
                    Settings
                </button>

                {canDelete && (
                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={disabled}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400
                                   hover:bg-rose-500/10 transition-all disabled:opacity-40 shrink-0"
                        aria-label="Delete passage"
                    >
                        <Trash2 size={13} />
                    </button>
                )}
            </div>

            {/* Passage meta — schema-correct fields */}
            {showMeta && (
                <div className="px-4 py-3 border-t border-slate-800/60 bg-slate-900/40">
                    <Menu title="Passage" >
                        <Field label="Part number" htmlFor="passage.partNumber">
                            <Select
                                value={passage.partNumber}
                                onChange={e => onChange("partNumber", Number(e.target.value) as Passage["partNumber"])}
                                disabled={disabled}
                            >
                                {[1, 2, 3, 4].map(n => (
                                    <option key={n} value={n}>Part {n}</option>
                                ))}
                            </Select>
                        </Field>
                        <Field label="Audio duration (s)" htmlFor="passage.audioDuration">
                            <Input
                                type="number" min={0}
                                value={passage.audioDuration}
                                onChange={e => onChange("audioDuration", Number(e.target.value))}
                                disabled={disabled}
                            />
                        </Field>
                        <Field label="Start Q#" htmlFor="passage.startQuestionNumber">
                            <Input
                                type="number" min={1} max={40}
                                value={passage.startQuestionNumber}
                                onChange={e => onChange("startQuestionNumber", Number(e.target.value))}
                                disabled={disabled}
                            />
                        </Field>
                        <Field label="Marks" htmlFor="passage.marks">
                            <Input
                                type="number" min={0}
                                value={passage.marks}
                                onChange={e => onChange("marks", Number(e.target.value))}
                                disabled={disabled}
                            />
                        </Field>
                        <Field label="Explanation (optional)" htmlFor="passage.explanation">
                            <Input
                                type="text"
                                value={passage.explanation}
                                onChange={e => onChange("explanation", e.target.value)}
                                placeholder="e.g. Notes about this passage"
                                disabled={disabled}
                            />
                        </Field>
                    </Menu>
                </div>
            )}

            {/* Split pane */}
            {!collapsed && (
                <div className="flex border-t border-slate-800/60" style={{ minHeight: "320px" }}>

                    {/* Left: question list */}
                    <div className="w-52 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/30">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                Forms
                            </span>
                            {passage.questions.length < LIMITS.QUESTIONS_MAX && (
                                <button
                                    type="button"
                                    onClick={handleAddQuestion}
                                    disabled={disabled}
                                    className="flex items-center gap-0.5 text-[10px] font-bold
                                               text-indigo-400 hover:text-indigo-300 disabled:opacity-40"
                                >
                                    <Plus size={10} /> Add
                                </button>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                            {passage.questions.length === 0 ? (
                                <p className="text-center py-8 text-[11px] text-slate-700">No questions yet</p>
                            ) : (
                                passage.questions.map((q, qi) => (
                                    <QuestionListItem
                                        key={qi}
                                        question={q}
                                        qi={qi}
                                        isActive={activeQ === qi}
                                        canDelete={passage.questions.length > 1}
                                        disabled={disabled}
                                        onSelect={() => setActiveQ(qi)}
                                        onDelete={() => handleDeleteQuestion(qi)}
                                    />
                                ))
                            )}
                        </div>

                        {passage.questions.length < LIMITS.QUESTIONS_MAX && (
                            <button
                                type="button"
                                onClick={handleAddQuestion}
                                disabled={disabled}
                                className="mx-2 mb-2 flex items-center justify-center gap-1 py-2
                                           border border-dashed border-slate-800 rounded-xl text-[10px]
                                           font-bold text-slate-700 hover:text-indigo-400
                                           hover:border-indigo-500/40 transition-all disabled:opacity-40"
                            >
                                <Plus size={10} /> Add question
                            </button>
                        )}
                    </div>

                    {/* Right: question editor */}
                    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950/30">
                        {passage.questions.length === 0 || activeQ >= passage.questions.length ? (
                            <div className="flex-1 flex items-center justify-center p-8 text-center">
                                <div>
                                    <p className="text-sm text-slate-500 font-semibold mb-1">No question selected</p>
                                    <p className="text-xs text-slate-700">Select a question or add a new one</p>
                                </div>
                            </div>
                        ) : (
                            <QuestionEditor
                                question={passage.questions[activeQ]}
                                qi={activeQ}
                                pi={si}
                                disabled={disabled}
                                diagramFiles={diagramFiles}
                                onDiagramFileChange={onDiagramFileChange}
                                onChange={updated => onQuestionChange(activeQ, updated)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useRecorder() {
    const [recording, setRecording] = useState(false);
    const [duration, setDuration]   = useState(0);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef   = useRef<Blob[]>([]);
    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);

    const start = async (): Promise<void> => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mr     = new MediaRecorder(stream);
        chunksRef.current = [];
        mr.ondataavailable = (e) => chunksRef.current.push(e.data);
        mr.start();
        recorderRef.current = mr;
        setRecording(true);
        setDuration(0);
        timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    };

    const stop = (): Promise<File> =>
        new Promise((resolve) => {
            const mr = recorderRef.current!;
            mr.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                resolve(new File([blob], `recording-${Date.now()}.webm`, { type: "audio/webm" }));
            };
            mr.stop();
            mr.stream.getTracks().forEach((t) => t.stop());
            clearInterval(timerRef.current!);
            setRecording(false);
        });

    return { recording, duration, start, stop };
}

/* ─────────────────────────────────────────────
   ListenModal (main)
───────────────────────────────────────────── */

export interface ListenModalProps {
    form:      ListenForm;
    setForm:   React.Dispatch<React.SetStateAction<ListenForm>>;
    onSave:    () => Promise<void>;
    onClose:   () => void;
    isEditing: boolean;
    loading:   boolean;
}

