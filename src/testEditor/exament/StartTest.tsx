
import { useNavigate, useParams } from "react-router";
import { userService } from "../../context/authService.ts";
import React, { useCallback, useEffect, useState } from "react";
import {
    type CardForm,
    type Difficulty,
    EMPTY_FORM,
    type IELTSCard,
} from "../card/carde.ts";
import { useToast } from "../../ui";
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    Headphones,
    HelpCircle,
    Layers,
    Mic,
    Pencil,
    PlayCircle,
    ChevronRight,
} from "lucide-react";
import { ToastBanner } from "../../ui/Toest.tsx";
import {buildExamSteps, type SkillKey} from "./ExamGenerator/exam/ExamFlow.ts";
import { Button } from "../../ui/UI.tsx";
import { useAuthStore } from "../../context/authStore.ts";

interface SkillSection {
    key:        SkillKey;
    label:      string;
    icon:       React.ReactNode;
    iconBg:     string;
    titleColor: string;
}

const SKILL_SECTIONS: SkillSection[] = [
    { key: "writeTest",   label: "Writing",   icon: <Pencil     size={15} />, iconBg: "bg-indigo-500/15",  titleColor: "text-indigo-400"  },
    { key: "readTest",   label: "Reading",   icon: <BookOpen   size={15} />, iconBg: "bg-blue-500/12",    titleColor: "text-blue-400"    },
    { key: "listenTest", label: "Listening", icon: <Headphones size={15} />, iconBg: "bg-emerald-500/12", titleColor: "text-emerald-400" },
    { key: "speakTest",  label: "Speaking",  icon: <Mic        size={15} />, iconBg: "bg-amber-500/12",   titleColor: "text-amber-400"   },
];

const DIFF_BADGE: Record<string, string> = {
    Easy:   "bg-emerald-500/12 border-emerald-500/28 text-emerald-400",
    Medium: "bg-amber-500/12  border-amber-500/28  text-amber-400",
    Hard:   "bg-red-500/12    border-red-500/28    text-red-400",
    Mixed:  "bg-violet-500/12 border-violet-500/28 text-violet-400",
};

const TYPE_BADGE: Record<string, string> = {
    mock_test:     "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
    practice_test: "bg-blue-500/12   border-blue-500/28   text-blue-400",
    mini_test:     "bg-amber-500/12  border-amber-500/28  text-amber-400",
};

const TYPE_LABEL: Record<string, string> = {
    mock_test:     "Mock test",
    practice_test: "Practice test",
    mini_test:     "Mini test",
};

async function fetchTestById(id: string): Promise<IELTSCard> {
    const res = await userService.fetchCard(id);
    if (!res.success) throw new Error(res.message ?? "Test not found");
    return res.data;
}

function StatBox({ value, label }: { value: string | number; label: string }) {
    return (
        <div className="flex flex-col gap-1 flex-1 px-4 py-3.5
                        border-r border-slate-700/30 last:border-r-0">
            <span className="text-base font-semibold font-mono text-slate-300">{value}</span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">{label}</span>
        </div>
    );
}

function SkillRow({ section, test }: { section: SkillSection; test: CardForm }) {
    const [open, setOpen] = useState(false);
    const skill = test[section.key] as { title?: string; status?: string; description?: string } | undefined;
    return (
        <div className={`bg-slate-900/80 border rounded-xl overflow-hidden transition-colors duration-150
            ${open ? "border-slate-600/40" : "border-slate-700/30 hover:border-slate-600/30"}`}>

            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                                    ${section.iconBg} ${section.titleColor}`}>
                        {section.icon}
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">
                            {section.label}
                        </p>
                        <p className={`text-sm font-medium ${skill ? "text-slate-300" : "text-slate-600 italic"}`}>
                            {skill?.title ?? "Not included"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                    {skill
                        ? <CheckCircle2 size={13} className="text-emerald-500/60" />
                        : <HelpCircle   size={13} className="text-slate-700" />}
                    <span className={`text-slate-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                        ▾
                    </span>
                </div>
            </button>

            {open && (
                <div className="px-4 pb-3.5 pt-0 pl-16 space-y-1.5">
                    <p className="text-xs text-slate-500 leading-relaxed">
                        {skill?.status ?? "This section is not part of this test."}
                    </p>
                    <hr className="border-slate-800" />
                    <p className="text-xs text-slate-500 leading-relaxed w-48 truncate">
                        {skill?.description ?? "No description available."}
                    </p>
                </div>
            )}
        </div>
    );
}

function ExamStepper({ steps }: { steps: ReturnType<typeof buildExamSteps> }) {
    const ICON_MAP: Record<SkillKey, React.ReactNode> = {
        writeTest:   <Pencil     size={12} />,
        readTest:   <BookOpen   size={12} />,
        listenTest: <Headphones size={12} />,
        speakTest:  <Mic        size={12} />,
    };

    const LABEL_MAP: Record<SkillKey, string> = {
        writeTest:   "Writing",
        readTest:   "Reading",
        listenTest: "Listening",
        speakTest:  "Speaking",
    };

    const COLOR_MAP: Record<SkillKey, { dot: string; text: string }> = {
        writeTest:   { dot: "bg-indigo-500",  text: "text-indigo-400"  },
        readTest:   { dot: "bg-blue-500",    text: "text-blue-400"    },
        listenTest: { dot: "bg-emerald-500", text: "text-emerald-400" },
        speakTest:  { dot: "bg-amber-500",   text: "text-amber-400"   },
    };

    return (
        <div className="flex items-center gap-0 mb-6">
            {steps.map((step, i) => {
                const colors = COLOR_MAP[step.key];
                const isLast = i === steps.length - 1;
                return (
                    <React.Fragment key={step.key}>
                        <div className="flex flex-col items-center gap-1.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors
                                ${i === 0 ? `${colors.dot} text-white` : "bg-slate-800 text-slate-600"}`}>
                                {ICON_MAP[step.key]}
                            </div>
                            <span className={`text-[9px] font-semibold uppercase tracking-wider
                                ${i === 0 ? colors.text : "text-slate-600"}`}>
                                {LABEL_MAP[step.key]}
                            </span>
                        </div>
                        {!isLast && <ChevronRight size={12} className="text-slate-700 mb-4 mx-1 shrink-0" />}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function Skeleton() {
    return (
        <div className="animate-pulse flex flex-col gap-4 max-w-xl mx-auto py-10 px-4">
            <div className="h-3 w-24 bg-slate-800 rounded-full" />
            <div className="h-6 w-3/4 bg-slate-800 rounded-lg" />
            <div className="h-3 w-full bg-slate-800 rounded" />
            <div className="h-3 w-2/3 bg-slate-800 rounded" />
            <div className="flex gap-0 border border-slate-800 rounded-xl overflow-hidden mt-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex-1 px-4 py-4 border-r border-slate-800 last:border-r-0">
                        <div className="h-4 w-8 bg-slate-800 rounded mb-1.5" />
                        <div className="h-2 w-12 bg-slate-800 rounded" />
                    </div>
                ))}
            </div>
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 bg-slate-800/60 rounded-xl" />
            ))}
        </div>
    );
}


export const StartTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [card,    setCard   ] = useState<CardForm>(EMPTY_FORM);
    const {user} = useAuthStore();

    const { toast, show: showToast } = useToast();
    const { id }   = useParams<{ id: string }>();
    const navigate = useNavigate();

    const linkedCount = [
        card.skills?.writing,
        card.skills?.reading,
        card.skills?.listening,
        card.skills?.speaking,
    ].filter(Boolean).length;

    const steps     = buildExamSteps(card);
    const firstStep = steps[0] ?? null;

    const fetchTest = useCallback(async () => {
        // Guard against an unresolved route placeholder (e.g. a nav link that
        // points at the literal "/tasks/:id"); ":id" is truthy so `!id` misses it.
        if (!id || id.startsWith(":")) return;
        setLoading(true);
        try {
            const res = await fetchTestById(id);
            setCard(res);
        } catch (err: unknown) {
            showToast(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Failed to load test",
                "ERROR",
            );
        } finally {
            setLoading(false);
        }
    }, [id, showToast]);

    useEffect(() => { fetchTest(); }, [fetchTest]);

    const handleStart = useCallback(async () => {
        if (!user?.is_subscription || user.attemptsUsed !== user.dailyAttemptsUsed) {
            return showToast('Warning: Subscription required', "WARNING");
        }

        try {
            const nextAttempts = (user.dailyAttemptsUsed ?? 0) + 1;

            await userService.updateDailyUsed(nextAttempts);

            navigate(firstStep.route, {
                state: { cardId: id },
            });
        } catch (err: unknown) {
            console.error('Failed to start process:', err);

            const message = err instanceof Error ? err.message : 'An error occurred while starting';
            showToast(message, "ERROR");
        }
    }, [user, firstStep, id, navigate, showToast]);


    return (
        <div className="min-h-screen bg-slate-950 text-base-content">
            <ToastBanner toast={toast} />

            <div className="max-w-xl mx-auto px-4 py-10">
                {loading ? (
                    <Skeleton />
                ) : (
                    <>
                        {/* Back */}
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-1.5 text-[11px] font-semibold uppercase
                                       tracking-widest text-slate-500 hover:text-slate-300
                                       transition-colors mb-6"
                        >
                            <ArrowLeft size={13} /> Back to library
                        </button>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {card.testType && (
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5
                                                  rounded-full border ${TYPE_BADGE[card.testType] ?? TYPE_BADGE.mock_test}`}>
                                    {TYPE_LABEL[card.testType] ?? card.testType}
                                </span>
                            )}
                            {card.accessType && (
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5
                                                  rounded-full border ${
                                    card.accessType === "free"
                                        ? "bg-emerald-500/12 border-emerald-500/28 text-emerald-400"
                                        : "bg-slate-700/40 border-slate-600/30 text-slate-400"
                                }`}>
                                    {card.accessType}
                                </span>
                            )}
                            {card.metadata?.difficulty && (
                                <span className={`text-[10px] font-semibold uppercase tracking-wide px-2.5 py-0.5
                                                  rounded-full border ${
                                    DIFF_BADGE[card.metadata.difficulty as Difficulty] ?? DIFF_BADGE.Mixed
                                }`}>
                                    {card.metadata.difficulty as Difficulty}
                                </span>
                            )}
                        </div>

                        {/* Title + description */}
                        <h1 className="text-xl font-semibold text-slate-100 leading-snug mb-2">
                            {card.title || "Untitled test"}
                        </h1>
                        {card.description && (
                            <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                {card.description}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex border border-slate-700/30 rounded-xl overflow-hidden mb-6">
                            {card.metadata?.estimatedDuration && (
                                <StatBox value={`${card.metadata.estimatedDuration}m`} label="Duration" />
                            )}
                            <StatBox value={linkedCount} label={`Skill${linkedCount !== 1 ? "s" : ""}`} />
                        </div>

                        {/* Stepper */}
                        {steps.length > 1 && <ExamStepper steps={steps} />}

                        {/* Skill sections */}
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3
                                      flex items-center gap-2">
                            <Layers size={11} aria-hidden="true" /> Included sections
                        </p>

                        <div className="flex flex-col gap-2 mb-6">
                            {SKILL_SECTIONS.map(section => (
                                <SkillRow key={section.key} section={section} test={card} />
                            ))}
                        </div>

                        <div className="h-px bg-indigo-500/20 mb-6" aria-hidden="true" />

                        {/* CTA */}
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <p className="text-xs text-slate-600">
                                {steps.length > 1
                                    ? `You'll complete ${steps.length} sections in order.`
                                    : "Make sure you are in a quiet place before starting."}
                            </p>
                            <Button
                                label={firstStep ? `Start ${steps.length > 1 ? "Exam" : LABEL_MAP[firstStep.key]}` : "No tests available"}
                                icon={<PlayCircle size={15} aria-hidden="true" />}
                                variant="secondary"
                                onClick={handleStart}
                                loading={!firstStep}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const LABEL_MAP: Record<SkillKey, string> = {
    writeTest:  "Writing",
    readTest:   "Reading",
    listenTest: "Listening",
    speakTest:  "Speaking",
};