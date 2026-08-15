import React, { useState, useCallback, useEffect } from "react";
import {
    X, Plus, BookOpen, Pencil, AlignLeft, Trash2, ChevronDown,
    FileText,
} from "lucide-react";
import {
    type Answer,
    type Section,
    type ReadForm,
    type FormBody,
    QUESTION_TYPES,
    QUESTION_TYPE_LABELS,
    EMPTY_Form_Body,
    LIMITS,
    type ReadTest,
} from "./readDTO.ts";
import { Button, Field, Input, Menu, SectionSimple, Select, Textarea } from "../../ui/UI.tsx";
import { LEVELS, MET_TYPE, STATUSES, TIERS, VISIBILITYS, type Level, type Status, type Tier, type Visibility, type WriteTestType } from "../index.ts";
import { adminService } from "../../context/authService.ts";

const MIN_BODY_LENGTH = 500;
const MAX_SECTIONS    = 4;
const MAX_QUESTIONS   = 40;
const MAX_OPTIONS     = 5;
const MIN_OPTIONS     = 2;

const inp = `w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100
    placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30
    focus:border-indigo-500/50 transition-all disabled:opacity-50`;

const lbl = `text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block`;

const OPTION_BASED_TYPES = new Set([
    "multiple_choice", "list_selection", "matching_features",
    "matching_headings", "matching_sentence_endings",
]);

const TABS = [
    { id: "info",     label: "Test info"            },
    { id: "passage",  label: "Passage"              },
    { id: "settings", label: "Settings"             },
    { id: "sections", label: "Sections & questions" },
] as const;
type TabId = typeof TABS[number]["id"];

const SECTION_ACCENTS = [
    { border: "border-l-indigo-500", pill: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
    { border: "border-l-teal-500",   pill: "bg-teal-500/10   text-teal-400   border-teal-500/20"   },
    { border: "border-l-amber-500",  pill: "bg-amber-500/10  text-amber-400  border-amber-500/20"  },
    { border: "border-l-rose-500",   pill: "bg-rose-500/10   text-rose-400   border-rose-500/20"   },
] as const;

const emptyAnswer = (): Answer => ({
    qusForm:  { From: undefined, To: undefined },
    formType: "multiple_choice",
    formBody: [EMPTY_Form_Body()],   // always start with one FormBody row
});

const emptySection = (index: number): Section => ({
    title:         `Section ${index}`,
    instructions:  "",
    body:          [emptyAnswer()],
    passingScore:  60,
});

const rangeCount = (answer: Answer): number => {
    const { From, To } = answer.qusForm ?? {};
    if (From == null || To == null || To < From) return 1;
    return To - From + 1;
};


interface FormBodyRowProps {
    index:          number;
    total:          number;
    row:            FormBody;
    needsOptions:   boolean;
    disabled:       boolean;
    onChange:       (updated: FormBody) => void;
    onOptionChange: (oi: number, value: string) => void;
    onAddOption:    () => void;
    onRemoveOption: (oi: number) => void;
}

const FormBodyRow: React.FC<FormBodyRowProps> = ({
                                                     index, total, row, needsOptions, disabled,
                                                     onChange, onOptionChange, onAddOption, onRemoveOption,
                                                 }) => {
    const set = <K extends keyof FormBody>(field: K, value: FormBody[K]) =>
        onChange({ ...row, [field]: value });

    return (
        <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/40">

            {/* Row label */}
            {total > 1 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Question {index + 1}
                </p>
            )}

            {/* Instructions (optional per-row) */}
            <div>
                <label className={lbl}>
                    Instructions{" "}
                    <span className="normal-case font-normal text-slate-600">(optional)</span>
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

            {/* Question text */}
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
                                ({row.options.length}/{MAX_OPTIONS})
                            </span>
                        </label>
                        {row.options.length < MAX_OPTIONS && (
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
                                {row.options.length > MIN_OPTIONS && (
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
                        {row.options.length < MIN_OPTIONS && (
                            <p className="text-[10px] text-rose-500/80">
                                At least {MIN_OPTIONS} options required
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Correct answer */}
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

            {/* Explanation */}
            <div>
                <label className={lbl}>
                    Explanation{" "}
                    <span className="normal-case font-normal text-slate-600">(optional)</span>
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
        </div>
    );
};

interface QuestionEditorProps {
    question:  Answer;
    disabled:  boolean;
    onChange:  (updated: Answer) => void;
}

const QuestionEditor: React.FC<QuestionEditorProps> = ({ question, disabled, onChange }) => {
    const needsOptions = OPTION_BASED_TYPES.has(question.formType ?? "");

    // Sync formBody length to match the Q# range whenever From/To change
    const handleRangeChange = (patch: Partial<Answer["qusForm"]>) => {
        const next: Answer["qusForm"] = { ...question.qusForm, ...patch };
        const count = Math.max(
            1,
            next.From != null && next.To != null && next.To >= next.From
                ? next.To - next.From + 1
                : question.formBody.length,
        );

        // Grow or shrink formBody to match
        let nextBody = [...question.formBody];
        while (nextBody.length < count) nextBody.push(EMPTY_Form_Body());
        if (nextBody.length > count) nextBody = nextBody.slice(0, count);

        onChange({ ...question, qusForm: next, formBody: nextBody });
    };

    // When formType changes, strip options from every row if type no longer needs them
    const handleTypeChange = (newType: Answer["formType"]) => {
        const stillNeedsOptions = OPTION_BASED_TYPES.has(newType ?? "");
        const nextBody = question.formBody.map(row => ({
            ...row,
            options: stillNeedsOptions ? (row.options.length ? row.options : ["", ""]) : [],
        }));
        onChange({ ...question, formType: newType, formBody: nextBody });
    };

    // Update a single FormBody row
    const handleRowChange = (ri: number, updated: FormBody) => {
        const formBody = question.formBody.map((r, i) => (i === ri ? updated : r));
        onChange({ ...question, formBody });
    };

    // Options helpers (per row)
    const handleOptionChange = (ri: number, oi: number, value: string) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri) return r;
            const options = r.options.map((o, j) => (j === oi ? value : o));
            return { ...r, options };
        });
        onChange({ ...question, formBody });
    };

    const handleAddOption = (ri: number) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri || r.options.length >= MAX_OPTIONS) return r;
            return { ...r, options: [...r.options, ""] };
        });
        onChange({ ...question, formBody });
    };

    const handleRemoveOption = (ri: number, oi: number) => {
        const formBody = question.formBody.map((r, i) => {
            if (i !== ri || r.options.length <= MIN_OPTIONS) return r;
            return { ...r, options: r.options.filter((_, j) => j !== oi) };
        });
        onChange({ ...question, formBody });
    };

    const expectedCount = rangeCount(question);
    const actualCount   = question.formBody.length;
    const mismatch      = actualCount !== expectedCount;

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

            {/* Q# range + type */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className={lbl}>Q# From</label>
                    <input
                        type="number" min={1} max={39} placeholder="1"
                        value={question.qusForm?.From ?? ""}
                        onChange={e =>
                            handleRangeChange({ From: e.target.value ? Number(e.target.value) : undefined })
                        }
                        disabled={disabled}
                        className={inp}
                    />
                </div>
                <div>
                    <label className={lbl}>Q# To</label>
                    <input
                        type="number" min={1} max={40} placeholder="5"
                        value={question.qusForm?.To ?? ""}
                        onChange={e =>
                            handleRangeChange({ To: e.target.value ? Number(e.target.value) : undefined })
                        }
                        disabled={disabled}
                        className={inp}
                    />
                </div>
                <div>
                    <label className={lbl}>Question type</label>
                    <select
                        value={question.formType ?? "multiple_choice"}
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

            {/* Range / formBody length info */}
            {question.qusForm?.From != null && question.qusForm?.To != null && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium
                                 ${mismatch
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                    : "bg-slate-800/60 border border-slate-800 text-slate-500"}`}>
                    <span>
                        Range Q{question.qusForm.From}–{question.qusForm.To}
                        {" · "}
                        {expectedCount} question row{expectedCount !== 1 ? "s" : ""}
                    </span>
                    {mismatch && (
                        <button
                            type="button"
                            onClick={() => handleRangeChange({})}   // re-triggers sync
                            disabled={disabled}
                            className="ml-auto underline text-amber-300 hover:text-amber-200 disabled:opacity-40"
                        >
                            Sync now
                        </button>
                    )}
                </div>
            )}

            {/* FormBody rows — one per question in the range */}
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
                            needsOptions={needsOptions}
                            disabled={disabled}
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

interface QuestionListItemProps {
    question:  Answer;
    qi:        number;
    isActive:  boolean;
    canDelete: boolean;
    disabled:  boolean;
    onSelect:  () => void;
    onDelete:  () => void;
}

const QuestionListItem: React.FC<QuestionListItemProps> = ({
                                                               question, qi, isActive, canDelete, disabled, onSelect, onDelete,
                                                           }) => {
    const firstQuestion = question.formBody[0]?.question ?? "";

    return (
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
            {/* Number bubble */}
            <span className="w-5 h-5 rounded-full bg-indigo-600/20 border border-indigo-500/30
                             flex items-center justify-center text-[9px] font-bold text-indigo-300 shrink-0">
                {qi + 1}
            </span>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide truncate">
                    {QUESTION_TYPE_LABELS[question.formType ?? "short_answer"]}
                </p>
                <p className="text-[11px] text-slate-300 truncate mt-0.5">
                    {firstQuestion || <span className="italic text-slate-600">No question yet</span>}
                </p>
                {question.qusForm?.From != null && question.qusForm?.To != null && (
                    <p className="text-[9px] text-slate-600 mt-0.5">
                        Q{question.qusForm.From}–{question.qusForm.To}
                        {" · "}
                        {question.formBody.length} row{question.formBody.length !== 1 ? "s" : ""}
                    </p>
                )}
            </div>

            {/* Delete */}
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
};

interface SectionPanelProps {
    section:          Section;
    si:               number;
    canDelete:        boolean;
    disabled:         boolean;
    onChange:         <K extends keyof Section>(field: K, value: Section[K]) => void;
    onDelete:         () => void;
    onAddQuestion:    () => void;
    onRemoveQuestion: (qi: number) => void;
    onQuestionChange: (qi: number, updated: Answer) => void;
}

const SectionPanel: React.FC<SectionPanelProps> = ({
                                                       section, si, canDelete, disabled,
                                                       onChange, onDelete, onAddQuestion, onRemoveQuestion, onQuestionChange,
                                                   }) => {
    const [collapsed, setCollapsed] = useState(false);
    const [activeQ,   setActiveQ]   = useState(0);

    const accent = SECTION_ACCENTS[si % SECTION_ACCENTS.length];

    const handleAddQuestion = () => {
        onAddQuestion();
        setActiveQ(section.body.length);
    };

    const handleDeleteQuestion = (qi: number) => {
        onRemoveQuestion(qi);
        setActiveQ(q => Math.max(0, q >= qi ? q - 1 : q));
    };

    return (
        <div className={`border border-slate-800 rounded-2xl overflow-hidden border-l-2 ${accent.border}`}>

            {/* Section header */}
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
                    §{si + 1}
                </span>

                <input
                    type="text"
                    value={section.title}
                    onChange={e => onChange("title", e.target.value)}
                    disabled={disabled}
                    placeholder="Section title"
                    className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-slate-200
                               placeholder:text-slate-600 outline-none border-b border-transparent
                               focus:border-slate-700 transition-colors"
                />

                <span className="text-10 font-bold text-slate-600 shrink-0">
                    {section.body.length} FORMS
                </span>

                {canDelete && (
                    <Button
                        variant="reset"
                        onClick={onDelete}
                        disabled={disabled}
                        icon={<Trash2 size={13} />}
                        aria-label="Delete section"
                    />
                        
                )}
            </div>

            {/* Split pane */}
            {!collapsed && (
                <div className="flex border-t border-slate-800/60" style={{ minHeight: "320px" }}>

                    {/* Left: question list */}
                    <div className="w-52 shrink-0 flex flex-col border-r border-slate-800/60 bg-slate-900/30">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/60">
                            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                forms
                            </span>
                            {section.body.length < MAX_QUESTIONS && (
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
                            {section.body.length === 0 ? (
                                <p className="text-center py-8 text-[11px] text-slate-700">
                                    No questions yet
                                </p>
                            ) : (
                                section.body.map((q, qi) => (
                                    <QuestionListItem
                                        key={qi}
                                        question={q}
                                        qi={qi}
                                        isActive={activeQ === qi}
                                        canDelete={section.body.length > 1}
                                        disabled={disabled}
                                        onSelect={() => setActiveQ(qi)}
                                        onDelete={() => handleDeleteQuestion(qi)}
                                    />
                                ))
                            )}
                        </div>

                        {section.body.length < MAX_QUESTIONS && (
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
                        {section.body.length === 0 || activeQ >= section.body.length ? (
                            <div className="flex-1 flex items-center justify-center p-8 text-center">
                                <div>
                                    <p className="text-sm text-slate-500 font-semibold mb-1">
                                        No question selected
                                    </p>
                                    <p className="text-xs text-slate-700">
                                        Select a question or add a new one
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <QuestionEditor
                                question={section.body[activeQ]}
                                disabled={disabled}
                                onChange={updated => onQuestionChange(activeQ, updated)}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


interface ReadModalProps {
    form:      ReadForm;
    setForm:   React.Dispatch<React.SetStateAction<ReadForm>>;
    onSave:    () => Promise<void>;
    onClose:   () => void;
    editingId: string | null;
    loading:   boolean;
}

const ReadModal: React.FC<ReadModalProps> = ({
        form, setForm, onSave, onClose, editingId, loading,
    }) => {
    const [activeTab, setActiveTab] = useState<TabId>("info");
    const isEditing = !!editingId;
    const [fetchLoading, setFetchLoading] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    const update = useCallback(
        <K extends keyof ReadForm>(key: K, value: ReadForm[K]) =>
            setForm(prev => ({ ...prev, [key]: value })),
        [setForm],
    );

        useEffect(() => {
        if (!editingId) return;

        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFetchLoading(true);
        setFetchError(null);

        adminService.getReadTestById(editingId)
            .then((res: { data: ReadTest }) => {
                if (cancelled) return;
                const { ...formData } = res.data;
                setForm(formData as ReadForm);
            })
            .catch((err: Error) => {
                if (!cancelled) setFetchError(err.message);
            })
            .finally(() => {
                if (!cancelled) setFetchLoading(false);
            });

        return () => { cancelled = true; };
    }, [editingId, setForm]);

    const updateMeta = useCallback(
        <K extends keyof NonNullable<ReadForm["metadata"]>>(
            key: K,
            value: NonNullable<ReadForm["metadata"]>[K]
        ) =>
            setForm(prev => ({
                ...prev,
                metadata: {
                    ...prev.metadata, // Spread normally without inline casting
                    [key]: value
                } as NonNullable<ReadForm["metadata"]> // Cast the outer resulting object instead
                })),
        [setForm]
    );


    const updateAccess = useCallback(
        <K extends keyof NonNullable<ReadForm["access"]>>(key: K, value: NonNullable<ReadForm["access"]>[K]) =>
            setForm(prev => ({ ...prev, access: ({ ...(prev.access ?? {}), [key]: value } as ReadForm["access"]) })),
        [setForm],
    );


    const updateSettings = useCallback(
        (key: keyof NonNullable<ReadForm["settings"]>, value: unknown) =>
            setForm(prev => ({ ...prev, settings: { ...prev.settings, [key]: value } })),
        [setForm],
    );

    const addSection = useCallback(() => {
        if (form.sections.length >= MAX_SECTIONS) return;
        setForm(prev => ({
            ...prev,
            sections: [...prev.sections, emptySection(prev.sections.length + 1)],
        }));
    }, [form.sections.length, setForm]);

    const removeSection = useCallback((si: number) =>
            setForm(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== si) })),
        [setForm]);

    const changeSection = useCallback(
        <K extends keyof Section>(si: number, field: K, value: Section[K]) =>
            setForm(prev => ({
                ...prev,
                sections: prev.sections.map((s, i) => i === si ? { ...s, [field]: value } : s),
            })),
        [setForm],
    );

    const addQuestion = useCallback((si: number) =>
            setForm(prev => {
                const sections = [...prev.sections];
                const body     = [...sections[si].body, emptyAnswer()];
                sections[si]   = { ...sections[si], body};
                return { ...prev, sections };
            }),
        [setForm]);

    const removeQuestion = useCallback((si: number, qi: number) =>
            setForm(prev => {
                const sections = [...prev.sections];
                const body     = sections[si].body.filter((_, i) => i !== qi);
                sections[si]   = { ...sections[si], body};
                return { ...prev, sections };
            }),
        [setForm]);

    const changeQuestion = useCallback((si: number, qi: number, updated: Answer) =>
            setForm(prev => {
                const sections = [...prev.sections];
                const body     = sections[si].body.map((a, i) => i === qi ? updated : a);
                sections[si]   = { ...sections[si], body };
                return { ...prev, sections };
            }),
        [setForm]);

    const totalQuestions = form.sections.reduce((s, sec) => s + sec.body.length, 0);
    const bodyOk         = form.body.length >= MIN_BODY_LENGTH;

    const totalQs = React.useMemo(() => {
        return form.sections.reduce(
            (sum, sec) =>
                sum +
                sec.body.reduce(
                    (qSum, ans) => qSum + ans.formBody.length,
                    0
                ),
            0
        );
    }, [form.sections]);

    React.useEffect(() => {
        setForm(prev => ({
            ...prev,
            stats: {
                ...(prev.stats ?? { totalQuestions: 0, totalMarks: 0 }),
                totalQuestions: totalQs,
            },
        }));
    }, [totalQs, setForm]);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={!loading ? onClose : undefined}
                aria-hidden="true"
            />

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                
                { fetchError && (
                <div> 
                    <div role="alert" className="alert alert-info alert-soft"> 
                    <div role="alert" className="alert alert-error alert-soft"> 
                        <span>Error! {fetchError}.</span> 
                    </div> 
                    </div> 
                </div>
                )}

                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isEditing ? "Edit Reading Test" : "Create Reading Test"}
                    className="w-full max-w-7xl h-full pointer-events-auto flex flex-col rounded-2xl
                               overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl"
                    style={{ maxHeight: "95dvh", height: "780px" }}
                >

                    {/* ── Header ── */}
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
                                    {isEditing ? "Edit reading test" : "New reading test"}
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                    {form.sections.length} section{form.sections.length !== 1 ? "s" : ""}
                                    {" · "}
                                    {totalQuestions} question forms number{totalQuestions !== 1 ? "s" : ""}
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

                    {/* ── Tabs ── */}
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

                    {/* ── Body ── */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">

                        {/* Test info */}
                        {activeTab === "info" && (
                            <>
                                <SectionSimple title="Test info" icon={<FileText size={20} className="text-indigo-400" />}>
                                    <div className="w-full flex flex-1 justify-between">
                                        <Field label="Title" htmlFor="form-title" required>
                                            <Input
                                                type="text"
                                                placeholder="e.g. The History of the Internet"
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
                                    <Field label="Description" htmlFor="form-description">
                                        <Textarea
                                            rows={3}
                                            placeholder="Brief description of this reading test…"
                                            value={form.description}
                                            onChange={e => update("description", e.target.value)}
                                            disabled={loading}
                                        />
                                    </Field>
                                </SectionSimple>
                            </>
                        )}

                        {/* Passage */}
                        {activeTab === "passage" && (
                            <div className="w-full h-full">
                                <Field label="Reading passage" htmlFor="" required>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className={`text-[10px] font-bold ${bodyOk ? "text-emerald-500" : "text-rose-500"}`}>
                                            {form.body.length} / {MIN_BODY_LENGTH} min chars
                                        </span>
                                    </div>
                                    <Textarea
                                        rows={22}
                                        placeholder="Paste or write the full reading passage here (minimum 500 characters)…"
                                        value={form.body}
                                        onChange={e => update("body", e.target.value)}
                                        disabled={loading}
                                    />
                                </Field>
                            </div>
                            
                        )}

                        {/* Settings */}
                        {activeTab === "settings" && (
                            <div className="space-y-6">
                                {/* Metadata Menu */}
                                <Menu title="Metadata" subtitle="Write test metadata">
                                    <Field label="Duration (min)" htmlFor="meta-estimatedDuration">
                                        <Input
                                        id="meta-estimatedDuration"
                                        type="number"
                                        min={LIMITS.DURATION_MIN}
                                        max={LIMITS.DURATION_MAX}
                                        value={form.metadata?.estimatedDuration ?? ""}
                                        onChange={(e) => {
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
                                        value={form.metadata?.topic ?? ""}
                                        onChange={(e) => updateMeta("topic", e.target.value)}
                                        placeholder="e.g. Environment, Technology"
                                        disabled={loading}
                                        />
                                    </Field>

                                    <Field label="Source" htmlFor="meta-source">
                                        <Input
                                        id="meta-source"
                                        type="text"
                                        value={form.metadata?.source ?? ""}
                                        onChange={(e) => updateMeta("source", e.target.value)}
                                        placeholder="e.g. Cambridge, Internal"
                                        disabled={loading}
                                        />
                                    </Field>

                                    <Field label="Level" htmlFor="meta-level">
                                        <Select
                                        id="meta-level"
                                        value={form.metadata?.level ?? ""}
                                        onChange={(e) => updateMeta("level", (e.target.value as Level) || null)}
                                        disabled={loading}
                                        >
                                        <option value="">Select Level</option>
                                        {LEVELS.map((l) => (
                                            <option key={l} value={l}>
                                            {l}
                                            </option>
                                        ))}
                                        </Select>
                                    </Field>

                                    <Field label="Write Test Type" htmlFor="meta-type">
                                        <Select
                                        id="meta-type"
                                        value={form.metadata?.type ?? ""}
                                        onChange={(e) => updateMeta("type", (e.target.value as WriteTestType) || null)}
                                        disabled={loading}
                                        >
                                        <option value="">Select Type</option>
                                        {MET_TYPE.map((s) => (
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
                                        value={form.metadata?.tags?.join(", ") ?? ""}
                                        onChange={(e) => {
                                            const raw = e.target.value;
                                            const parsed = raw
                                            ? raw.split(",").map((t) => t.trim()).filter(Boolean)
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
                                        value={form.metadata?.version ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            updateMeta("version", val === "" ? 0 : Number(val));
                                        }}
                                        disabled={loading}
                                        />
                                    </Field>
                                </Menu>

                                {/* Settings Menu */}
                                <Menu title="Settings" subtitle="Write test settings">
                                        
                                        <Field label="Show Answers After Submit" htmlFor="settings-showAnswersAfterSubmit">
                                            <Input
                                            id="settings-showAnswersAfterSubmit"
                                            type="checkbox"
                                            checked={!!form.settings?.showAnswersAfterSubmit}
                                            onChange={(e) => updateSettings("showAnswersAfterSubmit", e.target.checked)}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Shuffle Questions" htmlFor="settings-shuffleQuestions">
                                            <Input
                                            id="settings-shuffleQuestions"
                                            type="checkbox"
                                            checked={!!form.settings?.shuffleQuestions}
                                            onChange={(e) => updateSettings("shuffleQuestions", e.target.checked)}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Shuffle Options" htmlFor="settings-shuffleOptions">
                                            <Input
                                            id="settings-shuffleOptions"
                                            type="checkbox"
                                            checked={!!form.settings?.shuffleOptions}
                                            onChange={(e) => updateSettings("shuffleOptions", e.target.checked)}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Allow Review" htmlFor="settings-allowReview">
                                            <Input
                                            id="settings-allowReview"
                                            type="checkbox"
                                            checked={!!form.settings?.allowReview}
                                            onChange={(e) => updateSettings("allowReview", e.target.checked)}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Time Limit (Seconds)" htmlFor="settings-timeLimitSec">
                                            <Input
                                            id="settings-timeLimitSec"
                                            type="number"
                                            value={form.settings?.timeLimitSec ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateSettings("timeLimitSec", val === "" ? 0 : Number(val));
                                            }}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Max Attempts" htmlFor="settings-maxAttempts">
                                            <Input
                                            id="settings-maxAttempts"
                                            type="number"
                                            value={form.settings?.maxAttempts ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateSettings("maxAttempts", val === "" ? 0 : Number(val));
                                            }}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Passing Score" htmlFor="settings-passingScore">
                                            <Input
                                            id="settings-passingScore"
                                            type="number"
                                            value={form.settings?.passingScore ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateSettings("passingScore", val === "" ? 0 : Number(val));
                                            }}
                                            disabled={loading}
                                            />
                                        </Field>

                                        <Field label="Passing Band" htmlFor="settings-passingBand">
                                            <Input
                                            id="settings-passingBand"
                                            type="number"
                                            value={form.settings?.passingBand ?? ""}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                updateSettings("passingBand", val === "" ? 0 : Number(val));
                                            }}
                                            disabled={loading}
                                            />
                                        </Field>
                                </Menu>

                                {/* Access Control Menu */}
                                <Menu title="Access Control" subtitle="Configure pricing and tier access">
                                    <Field label="Is Free" htmlFor="access-isFree">
                                        <Input
                                        id="access-isFree"
                                        type="checkbox"
                                        checked={!!form.access?.isFree}
                                        onChange={(e) => updateAccess("isFree", e.target.checked)}
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
                                            value={form.access?.price ?? ""}
                                            onChange={(e) => {
                                            const val = e.target.value;
                                            updateAccess("price", val === "" ? 0 : Number(val));
                                            }}
                                            disabled={loading}
                                        />
                                        </Field>
                                    )}

                                    <Field label="Access Tier" htmlFor="access-tier">
                                        <Select
                                        id="access-tier"
                                        value={form.access?.tier ?? ""}
                                        onChange={(e) => updateAccess("tier", (e.target.value as Tier) || null)}
                                        disabled={loading}
                                        >
                                        <option value="">Select Tier</option>
                                        {TIERS.map((t) => (
                                            <option key={t} value={t}>
                                            {t}
                                            </option>
                                        ))}
                                        </Select>
                                    </Field>

                                    <Field label="Visibility" htmlFor="visibility">
                                        <Select
                                        id="visibility"
                                        value={form?.visibility ?? ""}
                                        onChange={(e) => update("visibility", e.target.value as Visibility)}
                                        disabled={loading}
                                        >
                                        <option value="">Select Visibility</option>
                                        {VISIBILITYS.map((v) => (
                                            <option key={v} value={v}>
                                            {v.charAt(0).toUpperCase() + v.slice(1)}
                                            </option>
                                        ))}
                                        </Select>
                                    </Field>
                                </Menu>
                            </div>
                        )}

                        {/* Sections & questions */}
                        {activeTab === "sections" && (
                            <div className="overflow-y-auto flex-1 py-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <AlignLeft size={12} className="text-slate-500" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                            Sections
                                        </span>
                                        <span className="px-1.5 py-0.5 rounded bg-slate-800
                                                         text-[10px] font-bold text-slate-500">
                                            {form.sections.length}/{MAX_SECTIONS}
                                        </span>
                                    </div>
                                    {form.sections.length < MAX_SECTIONS && (
                                        <Button
                                            label="Add section"
                                            onClick={addSection}
                                            disabled={loading}
                                            variant="outline"
                                            icon={<Plus size={11} />}
                                        />
                                    )}
                                </div>

                                {form.sections.map((section, si) => (
                                    <SectionPanel
                                        key={si}
                                        section={section}
                                        si={si}
                                        canDelete={form.sections.length > 1}
                                        disabled={loading}
                                        onChange={(field, value) => changeSection(si, field, value)}
                                        onDelete={() => removeSection(si)}
                                        onAddQuestion={() => addQuestion(si)}
                                        onRemoveQuestion={qi => removeQuestion(si, qi)}
                                        onQuestionChange={(qi, updated) => changeQuestion(si, qi, updated)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Footer ── */}
                    <div className="flex items-center justify-between gap-2.5 px-5 py-3.5
                                    border-t border-slate-800 bg-slate-900 shrink-0">
                        {form.body.length > 0 && !bodyOk ? (
                            <span className="text-[11px] text-rose-400 font-medium">
                                Passage too short ({form.body.length}/{MIN_BODY_LENGTH} chars)
                            </span>
                        ) : <span />}
                        {form.sections?.length !== 0 &&
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-base-content">
                                Total questions: 
                                {form.stats?.totalQuestions === 40 ?
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-lime-600">{form.stats?.totalQuestions}</span>
                                    :
                                    <span className="text-[10px] font-semibold uppercase tracking-widest text-rose-600">{form.stats?.totalQuestions}</span>
                                }/40
                            </span>
                        }
                        <div className="flex items-center gap-2">
                            <Button
                                label="Cancel"
                                onClick={onClose}
                                disabled={loading}
                                variant="ghost"
                            />
                            <Button
                                label={isEditing ? "Update test" : "Create test"}
                                onClick={onSave}
                                disabled={loading || fetchLoading}
                                variant="save"
                            />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
};

export default ReadModal;