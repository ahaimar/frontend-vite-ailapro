import React, {useEffect, useId, useRef, useState} from "react";
import {
    X,
    Plus,
    Pencil,
    Loader2,
    PenLine,
    BookOpen,
    Headphones,
    Mic,
    RefreshCw,
    Search,
    CheckCircle2, Circle
} from "lucide-react";
import type {CardForm, Difficulty, SkillKey} from "./carde.ts";
import {Button, Field, Input, Select, Textarea} from "../../ui/UI";
import {adminService} from "../../context/authService.ts";

const SKILL_KEYS: SkillKey[] = ["writing", "reading", "listening", "speaking"];

interface CardModalProps {
    form: CardForm;
    setForm: React.Dispatch<React.SetStateAction<CardForm>>;
    onSave: () => Promise<void>;
    onClose: () => void;
    isEditing: boolean;
    loading: boolean;
    error: string | null;
}

const SKILL_META: Record<SkillKey, { label: string; Icon: React.FC<{ size?: number; className?: string }>; accent: string; ring: string; }> = {
    writing: {label: "Writing", Icon: PenLine, accent: "from-indigo-500 to-violet-500", ring: "ring-indigo-500/50"},
    reading: {label: "Reading", Icon: BookOpen, accent: "from-cyan-500 to-blue-500", ring: "ring-cyan-500/50"},
    listening: {
        label: "Listening",
        Icon: Headphones,
        accent: "from-amber-500 to-orange-500",
        ring: "ring-amber-500/50"
    },
    speaking: {label: "Speaking", Icon: Mic, accent: "from-emerald-500 to-teal-500", ring: "ring-emerald-500/50"},
};

// TODO: metadata.type: "exam",
const SKILL_FETCHER: Record<SkillKey, (params?: Record<string, unknown>) => Promise<{data: Array<{ _id: string } & Record<string, string>>}>> = {
    writing: (params) => adminService.getWriteTask(params),
    reading: (params) => adminService.getReadTest(params),
    listening: (params) => adminService.getListenTask(params),
    speaking: (params) => adminService.getSpeakTask(params),
};

const SKILL_SINGLE_FETCHER: Record<SkillKey, (id: string) => Promise<{ data: Record<string, string> }>> = {
    writing: (id) => adminService.getWriteTaskById(id),
    reading: (id) => adminService.getReadTestById(id),
    listening: (id) => adminService.getListenTaskById(id),
    speaking: (id) => adminService.getSpeakTaskById(id),
};

const SKILL_NAME_KEY: Record<SkillKey, string> = {
    writing: "title",
    reading: "title",
    listening: "title",
    speaking: "title",
};

interface TestOption {
    _id: string;
    label: string;
}

interface SkillIdInputProps {
    sk: SkillKey;
    value: string | unknown;
    onChange: (sk: SkillKey, val: string | null) => void;
}

const SkillIdInput: React.FC<SkillIdInputProps> = ({sk, value, onChange}) => {
    const {label, Icon, accent, ring} = SKILL_META[sk];

    const uid = useId().replace(/:/g, "");
    const modalId = `modal-${sk}-${uid}`;
    const dialogRef = useRef<HTMLDialogElement>(null);

    const [options, setOptions] = useState<TestOption[]>([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<TestOption | null>(null);
    const hasFetched = useRef(false);

    // ── Resolve label for an externally supplied value ──────────────────────────
    useEffect(() => {
        let isMounted = true;
        if (!value) {
            setSelected(null);
            return;
        }

        const found = options.find((o) => o._id === value);
        if (found) {
            setSelected(found);
            return;
        }

        SKILL_SINGLE_FETCHER[sk](value as string)
            .then(({data}) => {
                if (isMounted) {
                    setSelected({_id: value as string, label: data[SKILL_NAME_KEY[sk]] ?? value});
                }
            })
            .catch(() => {
                if (isMounted) setSelected({_id: value as string, label : value as string});
            });

        return () => {
            isMounted = false;
        };
    }, [value, sk]); // Required do not add optional in this property

    // ── Load the options list ───────────────────────────────────────────────────
    const loadOptions = async (force = false) => {
        if (hasFetched.current && !force) return;   // cache hit — skip fetch

        setLoading(true);
        setError(null);
        try {
            const res = await SKILL_FETCHER[sk]({status: "published", limit: 50});
            setOptions(
                res.data
                    .filter((item) => !!item._id)
                    .map((item) => ({
                        _id: item._id,
                        label: item[SKILL_NAME_KEY[sk]] ?? `Untitled (${item._id})`,
                    }))
            );
            hasFetched.current = true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load options.");
            hasFetched.current = false;   // allow retry on next open
        } finally {
            setLoading(false);
        }
    };

    // ── Open: fetch (if needed) then show ──────────────────────────────────────
    // FIX: separated fetch guard from modal open — modal always opens
    const openModal = async () => {
        setQuery("");
        dialogRef.current?.showModal();   // open immediately — spinner shown inside
        await loadOptions();              // no-op if already cached
    };

    const handleRefresh = () => {
        hasFetched.current = false;
        loadOptions(true);
    };

    const closeModal = () => dialogRef.current?.close();

    const pick = (opt: TestOption) => {
        setSelected(opt);
        onChange(sk, opt._id);
        closeModal();
    };

    const clear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelected(null);
        onChange(sk, null);
    };

    const filtered = options.filter((o) =>
        o.label.toLowerCase().includes(query.toLowerCase())
    );

    const linked = !!value;

    // ─── Render ─────────────────────────────────────────────────────────────────
    return (
        <>
            <div onClick={openModal}
                 className={`group flex flex-col gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-150 w-full
                    ${linked
                     ? `bg-slate-800/60 border-slate-600 ring-2 ${ring}`
                     : "bg-slate-800/40 border-slate-700 hover:border-slate-500"
                 }`}
            >
                <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest
                        ${linked ? "text-slate-200" : "text-slate-500 group-hover:text-slate-400"}`}
                    >
                        <Icon size={12}/>
                        {label}
                    </span>
                    {linked && (
                        <button type="button" onClick={clear} className="text-slate-500 hover:text-rose-400 transition-colors">
                            <X size={12}/>
                        </button>
                    )}
                </div>

                {linked && selected ? (
                    <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full bg-linear-to-br ${accent} shrink-0`}/>
                        <span className="text-xs text-slate-300 truncate">{selected.label}</span>
                    </div>
                ) : (
                    <span className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
                        Click to select a {label.toLowerCase()} test…
                    </span>
                )}
            </div>

            <dialog ref={dialogRef} id={modalId} className="modal">
                <div className="modal-box bg-slate-900 border border-slate-700/60 rounded-2xl p-0 max-w-md overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 bg-slate-800/60">
                        <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-lg bg-linear-to-br ${accent} flex items-center justify-center`}>
                                <Icon size={12} className="text-white"/>
                            </div>
                            <span className="text-sm font-bold text-slate-100 tracking-tight">
                                Select {label} test
                            </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                            {/* Refresh button */}
                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={loading}
                                title="Refresh list"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                                hover:text-slate-200 hover:bg-slate-700 transition-all disabled:opacity-30"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
                            </button>
                            {/* Close button */}
                            <form method="dialog">
                                <button className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                                        hover:text-slate-200 hover:bg-slate-700 transition-all">
                                    <X size={14}/>
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="px-5 py-3 border-b border-slate-700/60 bg-slate-900">
                        <div className="relative">
                            <Search size={13}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
                            <input
                                autoFocus
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search ${label.toLowerCase()} tests…`}
                                className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-2
                                  text-sm text-slate-100 placeholder-slate-500
                                  focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Options list */}
                    <div className="overflow-y-auto max-h-72 px-3 py-2">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2">
                                <Loader2 size={20} className="text-indigo-400 animate-spin"/>
                                <span
                                    className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Loading…</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center gap-2 py-8">
                                <p className="text-xs text-rose-400 text-center">{error}</p>
                                <button
                                    type="button"
                                    onClick={handleRefresh}
                                    className="text-xs text-indigo-400 hover:text-indigo-300 underline transition-colors"
                                >
                                    Try again
                                </button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <p className="text-xs text-slate-500 text-center py-8">
                                No {label.toLowerCase()} tests found.
                            </p>
                        ) : (
                            filtered.map((opt) => {
                                const isActive = opt._id === value;
                                return (
                                    <button
                                        key={opt._id}
                                        type="button"
                                        onClick={() => pick(opt)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                                          transition-all duration-100 group/item mb-1
                                          ${isActive
                                            ? "bg-indigo-900/50 border border-indigo-600/50"
                                            : "hover:bg-slate-800 border border-transparent"
                                        }`}
                                    >
                                        {isActive
                                            ? <CheckCircle2 size={14} className="text-indigo-400 shrink-0"/>
                                            : <Circle size={14}
                                                      className="text-slate-600 group-hover/item:text-slate-400 shrink-0"/>
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium truncate ${isActive ? "text-indigo-200" : "text-slate-300"}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-[10px] text-slate-600 font-mono truncate mt-0.5">
                                                {opt._id}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    <div
                        className="px-5 py-3 border-t border-slate-700/60 bg-slate-800/40 flex justify-between items-center">
                        <span className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold">
                          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
                        </span>
                        <form method="dialog">
                            <button className="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest
                                border border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all">
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>

                {/* Backdrop */}
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};


const SectionZone: React.FC<{
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    accent?: string;
    optional?: string;
}> = ({
          title,
          subtitle,
          children,
          accent = "from-indigo-500 to-violet-500",
          optional,
      }) => (
    <fieldset className="fieldset bg-base-200/95 border-slate-500 rounded-box w-full border p-4">
        <div className={`h-0.5 bg-linear-to-r ${accent}`}/>
        <legend className="fieldset-legend capitalize">{title}</legend>

        {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5 mb-5">{subtitle}</p>
        )}

        <div className="p-6">{children}</div>

        {optional && <p className="label">{optional}</p>}
    </fieldset>
);

const CardModal: React.FC<CardModalProps> = ({form, setForm, onSave, onClose, isEditing, loading, }) => {


    const bindInput = (key: keyof Omit<CardForm, "skills" | "metadata">) => ({
        id: key,
        value: form[key] as string,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm((f) => ({...f, [key]: e.target.value})),
    });

    const bindSelect = (key: keyof Omit<CardForm, "skills" | "metadata">) => ({
        id: key,
        value: form[key] as string,
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
            setForm((f) => ({...f, [key]: e.target.value})),
    });

    const handleSkillChange = (sk: SkillKey, val: string | null) => setForm((f) => ({ ...f, skills: { ...f.skills, [sk]: val } }));

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                 onClick={!loading ? onClose : undefined}
            />

            {/* Dialog  */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                {/*<div className="w-full max-w-5xl pointer-events-auto flex flex-col max-h-screen rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl">*/}
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={isEditing ? "Edit Writing Test" : "Create Writing Test"}
                    className="w-full max-w-7xl pointer-events-auto flex flex-col rounded-2xl
                               overflow-hidden border border-slate-700/60 bg-slate-950 shadow-2xl"
                    style={{ maxHeight: "92dvh" }}
                >
                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-900 shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                {isEditing
                                    ? <Pencil size={13} className="text-indigo-400"/>
                                    : <Plus size={13} className="text-indigo-400"/>
                                }
                            </div>
                            <span className="text-sm font-bold text-slate-100 tracking-tight">
                                {isEditing ? "Edit card" : "New card"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500
                            hover:text-rose-500 hover:bg-slate-800 hover:border-rose-800 transition-all disabled:opacity-40"
                        >
                            <X size={15}/>
                        </button>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="overflow-y-auto flex-1 p-1 flex flex-col gap-5">
                        {/* Identity section */}
                        <SectionZone
                            title="Identity"
                            subtitle="Basic information about the card"
                        >
                            <div className="flex flex-col gap-2">
                                <Field label="Title" htmlFor="title" required>
                                    <Input
                                        {...bindInput("title")}
                                        placeholder="e.g. Academic mock test — set A"
                                        disabled={loading}
                                    />
                                </Field>

                                <Field label="Description" htmlFor="description" hint="Max 500 chars">
                                    <Textarea
                                        id="description"
                                        value={form.description}
                                        onChange={(e) => setForm((f) => ({...f, description: e.target.value}))}
                                        rows={5}
                                        maxLength={500}
                                        placeholder="Short description..."
                                        disabled={loading}
                                    />
                                </Field>
                            </div>
                        </SectionZone>

                        {/* Configuration section */}
                        <SectionZone
                            title="Configuration"
                            subtitle="Test type, access level and difficulty"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Test type" htmlFor="testType" required>
                                    <Select {...bindSelect("testType")} disabled={loading}>
                                        <option value="mock_test">Mock test</option>
                                        <option value="practice_test">Practice test</option>
                                        <option value="mini_test">Mini test</option>
                                    </Select>
                                </Field>

                                <Field label="Access" htmlFor="accessType" required>
                                    <Select {...bindSelect("accessType")} disabled={loading}>
                                        <option value="free">Free</option>
                                        <option value="paid">Paid</option>
                                    </Select>
                                </Field>

                                <Field label="IELTS type" htmlFor="type" required>
                                    <Select {...bindSelect("type")} disabled={loading}>
                                        <option value="both">Both</option>
                                        <option value="academic">Academic</option>
                                        <option value="general">General</option>
                                    </Select>
                                </Field>

                                <Field label="Difficulty" htmlFor="metadata.difficulty" required>
                                    <Select
                                        id="metadata.difficulty"
                                        value={form.metadata?.difficulty ?? ""}
                                        onChange={(e) => setForm((f) => ({
                                            ...f,
                                            metadata: {...f.metadata, difficulty: e.target.value as Difficulty}
                                        }))}
                                        disabled={loading}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                        <option value="Mixed">Mixed</option>
                                    </Select>
                                </Field>
                            </div>
                        </SectionZone>

                        {/* Skills section */}
                        <SectionZone
                            title="Linked skills"
                            subtitle="At least one skill must be selected"
                        >
                            <div className="grid grid-cols-1 gap-2">
                                {SKILL_KEYS.map((sk) => (
                                    <SkillIdInput
                                        key={sk}
                                        sk={sk}
                                        value={form?.skills?.[sk] as unknown}
                                        onChange={handleSkillChange}
                                    />
                                ))}
                            </div>
                        </SectionZone>

                        {/* Optional metadata section */}
                        <SectionZone
                            title="Metadata"
                            subtitle="Optional — topic and duration"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Topic" htmlFor="metadata.topic">
                                    <Input
                                        id="metadata.topic"
                                        value={form.metadata?.topic ?? ""}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                metadata: {
                                                    ...f.metadata,
                                                    topic: e.target.value}
                                            }))
                                        }
                                        placeholder="e.g. Environment"
                                        disabled={loading}
                                    />
                                </Field>

                                <Field label="Duration (min)" htmlFor="estimatedDuration">
                                    <Input
                                        id="estimatedDuration"
                                        type="number"
                                        min={5}
                                        max={300}
                                        value={form.metadata?.estimatedDuration ?? ""}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                metadata: {...f.metadata, estimatedDuration: Number(e.target.value)}
                                            }))
                                        }
                                        placeholder="165"
                                        disabled={loading}
                                    />
                                </Field>
                            </div>
                        </SectionZone>
                    </div>

                    {/* ── Footer ── */}
                    <div
                        className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-700/60 bg-slate-900/20 shrink-0">
                        <Button
                            label={'Cancel'}
                            variant="ghost"
                            onClick={onClose}
                            loading={loading}
                        />
                        <Button
                            label={isEditing ? "Update" : "Create card"}
                            icon={ loading ? <><Loader2 size={13}/></> : <><Plus size={13}/></> }
                            variant="save"
                            onClick={onSave}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </>
    );
};

export default CardModal;