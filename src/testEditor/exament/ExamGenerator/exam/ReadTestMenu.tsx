import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router";
import {
    CheckCircle2, AlertCircle,
    ChevronRight, ArrowRight,
    X,
    TextSearch,
    GripVertical,
    ChevronLeft,
} from "lucide-react";
import type { FormBody, QuestionType, ReadTest, Section } from "../../../readTask/readDTO.ts";
import { useToast } from "../../../../ui/index.ts";
import { userService } from "../../../../context/authService.ts";
import type { TestData } from "../../../SessionDTO.ts";
import { ToastBanner } from "../../../../ui/Toest.tsx";
import { Button } from "../../../../ui/UI";
import type { TestCorrectionDTO } from "../CorrectionDTO.ts";
import { useExamNav } from "./ExamFlow.ts";
import HeaderForm from "../Index.tsx";
import { useAuthStore } from "../../../../context/authStore.ts";


// ─── Constants ────────────────────────────────────────────────────────────────

const TF_OPTIONS = ["True", "False", "Not Given"] as const;
const YN_OPTIONS = ["Yes",  "No",    "Not Given"] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

// key format: "sectionIndex-answerIndex-formBodyIndex"
type AnswerMap = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────


const SKILL_LABEL: Record<string, string> = {
    writeTest:  "Writing",
    readTest:   "Reading",
    listenTest: "Listening",
    speakTest:  "Speaking",
};

const rowKey = (sIdx: number, aIdx: number, fbIdx: number) =>
    `${sIdx}-${aIdx}-${fbIdx}`;

const totalRows = (sections: Section[]): number =>
    sections.reduce((acc, s) =>
        acc + s.body.reduce((a2, ans) => a2 + (ans.formBody?.length ?? 1), 0), 0,
    );

const totalAnswered = (map: AnswerMap): number =>
    Object.values(map).filter(Boolean).length;

const resolveOptions = (type: QuestionType, row: FormBody): string[] => {
    if (type === "true_false") return [...TF_OPTIONS];
    if (type === "yes_no")     return [...YN_OPTIONS];
    return row.options ?? [];
};

const isFreeText = (type: QuestionType): boolean =>
    type === "short_answer" || type === "summary_completion";

// ─── Sub-components ───────────────────────────────────────────────────────────


const QuestionGrid: React.FC<{
    sections:         Section[];
    answers:          AnswerMap;
    activeSectionIdx: number;
}> = ({ sections, answers, activeSectionIdx }) => (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
        {sections.map((section, sIdx) => (
            <div key={sIdx}>
                <p className="text-[10px] uppercase tracking-widest text-base-content/40 font-medium mb-2">
                    Section {sIdx + 1}
                </p>
                <div className="grid grid-cols-4 gap-1">
                    {section.body.flatMap((ans, aIdx) =>
                        (ans.formBody ?? [{ question: "" } as FormBody]).map((_, fbIdx) => {
                            const key  = rowKey(sIdx, aIdx, fbIdx);
                            const done = !!answers[key];
                            const num  = section.body
                                .slice(0, aIdx)
                                .reduce((a, b) => a + (b.formBody?.length ?? 1), 0) + fbIdx + 1;
                            return (
                                <button
                                    key={key}
                                    onClick={() =>
                                        document.getElementById(`q-${key}`)
                                            ?.scrollIntoView({ behavior: "smooth", block: "center" })
                                    }
                                    className={`w-full aspect-square rounded text-xs font-medium transition-all ${
                                        done
                                            ? "bg-lime-600 text-white"
                                            : sIdx === activeSectionIdx
                                                ? "bg-base-300 text-base-content/70 ring-1 ring-lime-600/40"
                                                : "bg-base-200 text-base-content/40 hover:bg-base-300"
                                    }`}
                                >
                                    {num}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        ))}
    </div>
);

const FormBodyItem: React.FC<{
    row:      FormBody;
    type:     QuestionType;
    sIdx:     number;
    aIdx:     number;
    fbIdx:    number;
    qNum:     number;
    value:    string;
    onChange: (key: string, val: string) => void;
    disabled: boolean;
}> = ({ row, type, sIdx, aIdx, fbIdx, qNum, value, onChange, disabled }) => {
    const key     = rowKey(sIdx, aIdx, fbIdx);
    const options = resolveOptions(type, row);
    const free    = isFreeText(type);

    return (
        <div
            id={`q-${key}`}
            className={`p-4 rounded-xl border transition-all ${
                value ? "border-lime-800/40 bg-lime-900/10" : "border-base-300 bg-base-100"
            }`}
        >
            <div className="flex items-start gap-3">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                                  text-xs font-bold ${
                    value ? "bg-lime-600 text-white" : "bg-base-300 text-base-content/60"
                }`}>
                    {qNum}
                </span>

                <div className="flex-1 min-w-0">
                    {row.instructions && (
                        <p className="text-xs text-base-content/50 italic mb-1">{row.instructions}</p>
                    )}
                    <p className="text-sm text-base-content leading-relaxed mb-2">
                        {row.question}
                    </p>

                    {free ? (
                        <input
                            type="text"
                            value={value}
                            disabled={disabled}
                            onChange={e => onChange(key, e.target.value)}
                            placeholder="Write your answer…"
                            className="input input-bordered input-sm w-full focus:outline-primary"
                        />
                    ) : (
                        <div className="flex flex-col gap-1.5">
                            {options.map(opt => (
                                <label
                                    key={opt}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
                                                border text-sm transition-all ${
                                        value === opt
                                            ? "border-lime-600 bg-lime-900/20 text-base-content"
                                            : "border-base-300 hover:border-base-content/30 text-base-content/70"
                                    } ${disabled ? "pointer-events-none opacity-60" : ""}`}
                                >
                                    <input
                                        type="radio"
                                        name={key}
                                        value={opt}
                                        checked={value === opt}
                                        disabled={disabled}
                                        onChange={() => onChange(key, opt)}
                                        className="radio radio-xs radio-success"
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    )}

                    {disabled && row.correctAnswer && (
                        <p className={`mt-2 text-xs font-medium ${
                            value === row.correctAnswer ? "text-lime-400" : "text-rose-400"
                        }`}>
                            Correct: {row.correctAnswer}
                        </p>
                    )}
                    {disabled && row.explanation && (
                        <p className="mt-1 text-xs text-base-content/50 italic">
                            {row.explanation}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

const SectionPanel: React.FC<{
    section:  Section;
    sIdx:     number;
    answers:  AnswerMap;
    onChange: (key: string, val: string) => void;
    disabled: boolean;
}> = ({ section, sIdx, answers, onChange, disabled }) => (
    <div className="flex flex-col gap-3">
        <div className="sticky top-0 z-10 bg-base-100 pb-2 pt-1">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-0.5">
                        Section {sIdx + 1}
                    </p>
                    <h3 className="text-sm font-semibold text-base-content">{section.title}</h3>
                </div>
            </div>
            {section.instructions && (
                <p className="text-xs text-base-content/50 italic mt-1 leading-relaxed">
                    {section.instructions}
                </p>
            )}
        </div>

        {section.body.map((answer, aIdx) => {
            const type = answer.formType ?? "short_answer";
            return (answer.formBody ?? []).map((row, fbIdx) => {
                const priorRows   = section.body
                    .slice(0, aIdx)
                    .reduce((acc, curr) => acc + (curr.formBody ?? []).length, 0);
                const currentQNum = priorRows + fbIdx + 1;
                return (
                    <FormBodyItem
                        key={rowKey(sIdx, aIdx, fbIdx)}
                        row={row}
                        type={type as QuestionType}
                        sIdx={sIdx}
                        aIdx={aIdx}
                        fbIdx={fbIdx}
                        qNum={currentQNum}
                        value={answers[rowKey(sIdx, aIdx, fbIdx)] ?? ""}
                        onChange={onChange}
                        disabled={disabled}
                    />
                );
            });
        })}
    </div>
);

interface ModelResultProps {
  modalRef: React.RefObject<HTMLDialogElement | null>;
  test: ReadTest;
  correction: TestCorrectionDTO | null;
}

const formatDuration = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
};

export const ModelResult: React.FC<ModelResultProps> = ({ modalRef, test, correction }) => {
  const handleClose = () => modalRef.current?.close();

  if (!test || !test?.sections) {
    return null;
  }

  const isScoring  = !correction || correction.status === "scoring";
  const isFailed   = correction?.status === "failed";
  const isComplete = correction?.status === "completed";

  // Group flat testData back into sections, in submission order.
  const sectionsWithResults = test.sections.map((section, sIdx) => {
    const rowsInSection = section.body.reduce(
      (a, b) => a + (b.formBody?.length ?? 1), 0,
    );
    const priorRows = test.sections
      .slice(0, sIdx)
      .reduce((acc, s) => acc + s.body.reduce((a, b) => a + (b.formBody?.length ?? 1), 0), 0);

    const rows = correction?.testData.slice(priorRows, priorRows + rowsInSection) ?? [];
    const correctCount = rows.filter(r => r.scoreRaw === 1).length;

    return { section, rows, correctCount, rowsInSection };
  });

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box max-w-5xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Reading Results</h3>
                <Button
                    onClick={handleClose}
                    className="btn btn-sm btn-circle btn-ghost"
                    aria-label="Close modal"
                    icon={<X />}
                />
            </div>

            <div className="space-y-6">
            {/* Status states */}
            {isScoring && (
                <div className="alert alert-info">
                <div className="text-sm">
                    Your responses are being evaluated by our AI system. Results typically appear within a few minutes.
                </div>
                </div>
            )}

            {isFailed && (
                <div className="alert alert-error">
                <AlertCircle className="h-5 w-5" />
                <div className="text-sm">
                    {correction?.comments || "Something went wrong while scoring this test. Please contact support."}
                </div>
                </div>
            )}

            {/* Test Summary */}
            <div className="bg-base-200 rounded-lg p-4">
                <h4 className="font-semibold text-sm mb-3 text-base-content/70 uppercase tracking-wide">
                Test Summary
                </h4>
                <div className="space-y-2 text-sm">
                <p>
                    <span className="text-base-content/60">Sections completed:</span>{' '}
                    <span className="font-semibold">{test.sections.length}</span>
                </p>
                <p>
                    <span className="text-base-content/60">Time spent:</span>{' '}
                    <span className="font-semibold">
                    {correction ? formatDuration(correction.timeSpent) : `${test.settings?.timeLimitSec ?? "-"} minutes`}
                    </span>
                </p>
                {isComplete && (
                    <>
                    <p>
                        <span className="text-base-content/60">Score:</span>{' '}
                        <span className="font-semibold text-indigo-500">
                        {correction?.score ?? "-"}
                        </span>
                    </p>
                    <p>
                        <span className="text-base-content/60">Accuracy:</span>{' '}
                        <span className="font-semibold text-lime-500">
                        {correction?.accuracy != null ? `${Math.round(correction.accuracy * 100)}%` : "-"}
                        </span>
                    </p>
                    </>
                )}
                </div>
            </div>

            {/* Weak questions callout */}
            {isComplete && correction?.weakQuestions?.length > 0 && (
                <div>
                <h4 className="font-semibold text-sm mb-2 text-base-content/70 uppercase tracking-wide">
                    Areas to review
                </h4>
                <div className="flex flex-wrap gap-1.5">
                    {correction.weakQuestions.map(q => (
                    <span key={q} className="badge badge-warning badge-sm">{q}</span>
                    ))}
                </div>
                </div>
            )}

            {/* Section breakdown */}
            <div>
                <h4 className="font-semibold text-sm mb-3 text-base-content/70 uppercase tracking-wide">
                Section Scores
                </h4>
                <div className="space-y-2">
                {sectionsWithResults.map(({ section, correctCount, rowsInSection }, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                    <span className="text-sm font-medium">{section.title}</span>
                    <span className="text-xs text-base-content/50">
                        {isComplete ? `${correctCount}/${rowsInSection} correct` : "Pending evaluation"}
                    </span>
                    </div>
                ))}
                </div>
            </div>

            {/* Per-question detail, only once scored */}
            {isComplete && (
                <div>
                <h4 className="font-semibold text-sm mb-3 text-base-content/70 uppercase tracking-wide">
                    Question Review
                </h4>
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {correction?.testData.map(row => {
                    const isCorrect = row.scoreRaw === 1;
                    return (
                        <div
                        key={row.questionNumber}
                        className={`p-3 rounded-lg border text-sm ${
                            isCorrect
                            ? "border-lime-800/40 bg-lime-900/10"
                            : "border-rose-800/40 bg-rose-900/10"
                        }`}
                        >
                        <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-xs text-base-content/60">
                            {row.questionNumber}
                            </span>
                            {isCorrect ? (
                            <CheckCircle2 className="h-4 w-4 text-lime-400 shrink-0" />
                            ) : (
                            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                            )}
                        </div>
                        <p className="text-base-content/80 mt-1">{row.questionBody}</p>
                        <p className="mt-1 text-xs">
                            <span className="text-base-content/50">Your answer: </span>
                            <span className={isCorrect ? "text-lime-400" : "text-rose-400"}>
                            {row.userAnswer || "—"}
                            </span>
                        </p>
                        {!isCorrect && (
                            <p className="text-xs">
                            <span className="text-base-content/50">Correct answer: </span>
                            <span className="text-lime-400">{row.correctAnswer}</span>
                            </p>
                        )}
                        {row.explanation && (
                            <p className="mt-1 text-xs text-base-content/50 italic">{row.explanation}</p>
                        )}
                        </div>
                    );
                    })}
                </div>
                </div>
            )}
            </div>

            {/* Footer */}
            <div className="modal-action mt-6">
            <button onClick={handleClose} className="btn btn-ghost">
                Close
            </button>
            </div>
        </div>

      {/* Click backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button type="button">close</button>
      </form>
    </dialog>
  );
};
 

// ─── Main component ───────────────────────────────────────────────────────────

const ReadMudExam: React.FC = () => {
    const {user} = useAuthStore();
    const { goNext, goFinish, isLast, nextStep } = useExamNav();
    const { id } = useParams<{ id: string }>();

    const [test,          setTest         ] = useState<ReadTest | null>(null);
    const [answers,       setAnswers      ] = useState<AnswerMap>({});
    const [timeLeft,      setTimeLeft     ] = useState(60 * 60);
    const [activeSection, setActiveSection] = useState(0);
    const [submitting,    setSubmitting   ] = useState(false);
    const [submitted,     setSubmitted    ] = useState(false);
    const [loading,       setLoading      ] = useState(true);

    const { toast, show: showToast } = useToast();
    const answersRef       = useRef(answers);
    answersRef.current     = answers;
    const passagePanelRef  = useRef<HTMLDivElement>(null);
    const questionPanelRef = useRef<HTMLDivElement>(null);

    const modalRef = useRef<HTMLDialogElement>(null);
    const [correction, setCorrection] = useState<TestCorrectionDTO | null>(null);

    /** Layout state — right/bottom panel sizing + sidebar collapse */
    const [isLeftCollapsed, setIsLeftCollapsed] = useState(false);
    const isDraggingRef = useRef(false);
    const [rightWidth, setRightWidth] = useState(300);
    const [bottomHeight, setBottomHeight] = useState(280);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleMove = (clientY: number, clientX: number) => {
            if (!isDraggingRef.current) return;

            if (window.innerWidth < 768) {
                // Mobile: dragging the horizontal grip resizes the questions panel's height
                // (panel is anchored to the bottom of the stacked layout).
                const newHeight = window.innerHeight - clientY;
                if (newHeight > 120 && newHeight < window.innerHeight * 0.7) {
                    setBottomHeight(newHeight);
                }
            } else {
                // Desktop: dragging the vertical grip resizes the questions panel's width.
                const newWidth = window.innerWidth - clientX;
                if (newWidth > 240 && newWidth < window.innerWidth * 0.5) {
                    setRightWidth(newWidth);
                }
            }
        };

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY, e.clientX);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                // Prevent the page from scrolling while actively dragging a resize handle.
                if (isDraggingRef.current) e.preventDefault();
                handleMove(e.touches[0].clientY, e.touches[0].clientX);
            }
        };

        const handleEnd = () => {
            if (isDraggingRef.current) {
                isDraggingRef.current = false;
                document.body.style.cursor = "default";
                document.body.style.userSelect = "auto";
            }
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleEnd);
        window.addEventListener("touchmove", handleTouchMove, { passive: false });
        window.addEventListener("touchend", handleEnd);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleEnd);
            window.removeEventListener("touchmove", handleTouchMove);
            window.removeEventListener("touchend", handleEnd);
        };
    }, []);

    const startResize = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = isMobile ? "row-resize" : "col-resize";
        document.body.style.userSelect = "none";
    };

    // ── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        userService.getReadTestById(id)
            .then(res => {
                if (!res.success) throw new Error(res.message ?? "Test not found");
                const data: ReadTest = res.data;
                setTest(data);
                setTimeLeft((data.metadata?.estimatedDuration ?? 60) * 60);
            })
            .catch((err: unknown) => showToast(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ??
                (err as Error)?.message ??
                "Failed to load test",
                "ERROR",
            ))
            .finally(() => setLoading(false));
    }, [id, showToast]);

    // ── Timer ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (submitted) return;
        const iv = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(iv);
                    showToast("Time's up!", "WARNING");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [submitted, showToast]);

    // ── Section scroll observer ───────────────────────────────────────────────

    useEffect(() => {
        if (!test) return;
        const root     = questionPanelRef.current;
        const observer = new IntersectionObserver(
            entries => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const idx = Number(entry.target.getAttribute("data-section"));
                        if (!isNaN(idx)) setActiveSection(idx);
                    }
                }
            },
            { root, threshold: 0.4 },
        );
        test.sections.forEach((_, i) => {
            const el = document.getElementById(`section-${i}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [test]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handleAnswer = useCallback((key: string, val: string) => {
        setAnswers(prev => ({ ...prev, [key]: val }));
    }, []);

    const handleSectionTab = useCallback((idx: number) => {
        setActiveSection(idx);
        document.getElementById(`section-${idx}`)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        passagePanelRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!test || !id || submitting) return;

        const ans   = answersRef.current;
        const total = totalRows(test.sections);
        const done  = totalAnswered(ans);

        // Reading allows partial submission — warn but don't block.
        if (done < total) {
            showToast(
                `${total - done} question${total - done > 1 ? "s" : ""} unanswered. Submit anyway?`,
                "WARNING",
            );
        }

        const testData: TestData[] = test.sections.flatMap((section, sIdx) =>
            section.body.flatMap((answer, aIdx) =>
                (answer.formBody ?? []).map((row, fbIdx) => ({
                    questionNumber: `Q${
                        section.body
                            .slice(0, aIdx)
                            .reduce((a, b) => a + (b.formBody?.length ?? 1), 0) + fbIdx + 1
                    }`,
                    questionBody:  row.question,
                    explanation:   row.explanation ?? "",
                    userAnswer:    ans[rowKey(sIdx, aIdx, fbIdx)] ?? "",
                    correctAnswer: row.correctAnswer ?? "",
                    scoreRaw:      ans[rowKey(sIdx, aIdx, fbIdx)] === row.correctAnswer ? 1 : 0,
                })),
            ),
        );

        const durationSec = (test.metadata?.estimatedDuration ?? 60) * 60;

        setSubmitting(true);
        try {
            const res = await userService.CreateSession({
                testRef:   test._id,
                testModel: "Reading",
                testData,
                timeSpent: durationSec - timeLeft,
            });

            setSubmitted(true);
            showToast("Test submitted successfully!", "SUCCESS");
            setCorrection(res?.data)
        } catch (err: unknown) {
            showToast(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Failed to submit. Please try again.",
                "ERROR",
            );
        } finally {
            setSubmitting(false);
        }
    }, [test, id, submitting, showToast, timeLeft]);

    // ── Guards ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary" />
        </div>
    );

    if (!test) return (
        <div className="alert alert-error m-10 w-auto">
            <AlertCircle className="h-5 w-5" /> Test not found or failed to load.
        </div>
    );

    // FIX: was "Reading Test Submitted!" — Title Case inconsistent with other modules
    // FIX: continue button had a JSX bug: <>`Continue to ${...}`<ArrowRight /></>
    //      wraps a template literal string and an element in a fragment — the backticks
    //      render as literal characters in the DOM. Unwrapped to a plain string + sibling element.
    if (submitted) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-base-content">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h2 className="text-2xl font-bold">Reading submitted!</h2>
            <p className="text-base-content/60">Your answers have been recorded.</p>
            <div className="flex gap-3">
               
                <Button
                    onClick={() => isLast ? goFinish() : goNext()}
                    
                >
                    {isLast ? (
                        <><CheckCircle2 size={15} /> Finish exam</>
                    ) : (
                        <>Continue to {SKILL_LABEL[nextStep?.key ?? ""] ?? "next"} section <ArrowRight size={15} /></>
                    )}
                </Button>
                { user?.is_subscription && 
                    <Button 
                            label="View Results"
                            variant="secondary"
                            icon={<TextSearch size={16} />}
                            onClick={() => modalRef.current?.showModal()}
                            aria-label="View detailed exam results and data"
                        />
                }
                
            </div>
            <>
                {/* Only render if test data is available */}
                {test && (
                <ModelResult 
                    modalRef={modalRef} 
                    test={test} 
                    correction={correction} 
                />
                )}
            </>
        </div>
    );

    const answered = totalAnswered(answers);
    const total    = totalRows(test.sections);

    return (
        <div className="flex flex-col h-screen bg-base-100 overflow-hidden w-full">
            <ToastBanner toast={toast} />
            <>
                <HeaderForm
                    config={{
                        typeLabel: "IELTS Reading",
                        title: test.title,
                        topic: test.metadata?.topic
                    }}
                    telemetry={{
                        timeLeft: timeLeft,
                        answered: answered,
                        total: total
                    }}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                />
            </>
            

            {/* Stacks vertically on mobile, side-by-side from md up */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

                <aside
                    className={`bg-base-200 transition-all duration-300 overflow-hidden shrink-0
                        ${isLeftCollapsed
                            ? 'h-0 md:h-auto w-full md:w-0 p-0'   // Collapse smoothly on either axis
                            : 'w-full md:w-1/4 p-6'
                        }`}
                >
                    <QuestionGrid
                        sections={test.sections}
                        answers={answers}
                        activeSectionIdx={activeSection}
                    />
                </aside>

                {/* Sidebar collapse toggle */}
                <button
                    onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
                    className="flex items-center justify-center bg-base-300 hover:bg-neutral hover:text-neutral-content
                               transition-colors w-full h-4 md:w-4 md:h-full shrink-0"
                    aria-label="Toggle question grid"
                >
                    {isLeftCollapsed ? (
                        <ChevronRight size={16} className="hidden md:block" />
                    ) : (
                        <ChevronLeft size={16} className="hidden md:block" />
                    )}
                </button>

                {/* Passage panel */}
                <div
                    ref={passagePanelRef}
                    className="flex-1 overflow-y-auto p-6 md:border-r border-base-300 min-h-0"
                >
                    <div className="max-w-prose mx-auto">
                        {test.metadata?.topic && (
                            <p className="text-xs text-base-content/40 uppercase tracking-widest mb-2 font-medium">
                                {test.metadata.topic}
                            </p>
                        )}
                        <h2 className="text-xl font-bold mb-1 text-base-content">{test.title}</h2>
                        {test.description && (
                            <p className="text-sm text-base-content/60 italic mb-4">{test.description}</p>
                        )}
                        <p className="text-sm leading-relaxed text-base-content/80 whitespace-pre-line">
                            {test.body}
                        </p>
                    </div>
                </div>

                {/* Resize grip — vertical bar (width drag) on desktop, horizontal bar (height drag) on mobile */}
                <div 
                    onMouseDown={startResize} 
                    onTouchStart={startResize} 
                    className="relative z-10 flex items-center justify-center bg-base-300 hover:bg-neutral hover:text-neutral-content shrink-0 w-0.5 h-full cursor-col-resize overflow-visible"
                > 
                    <GripVertical 
                        size={40} 
                        className="absolute z-10 w-6 h-10 text-base-content/50 rounded-2xl
                        hover:bg-neutral hover:text-neutral-content" 
                    /> 
                </div>

                {/* Questions panel */}
                <div
                    ref={questionPanelRef}
                    className={`overflow-auto p-6 w-full ${isMobile ? 'bg-base-100' : 'bg-base-200 md:w-80'}`}
                    style={isMobile ? { height: `${bottomHeight}px` } : { width: `${rightWidth}px` }}
                >
                    {test.sections.map((section, sIdx) => (
                        <div key={sIdx} id={`section-${sIdx}`} data-section={sIdx}>
                            <SectionPanel
                                section={section}
                                sIdx={sIdx}
                                answers={answers}
                                onChange={handleAnswer}
                                disabled={submitted}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <footer className="flex border-t border-base-300 shrink-0 overflow-x-auto items-center justify-center p-2 gap-3">
                {test.sections.map((section, i) => {
                    const sectionRows = section.body.reduce(
                        (a, b) => a + (b.formBody?.length ?? 1), 0,
                    );
                    const done = section.body.reduce(
                        (acc, ans, aIdx) =>
                            acc + (ans.formBody ?? []).filter(
                                (_, fbIdx) => !!answers[rowKey(i, aIdx, fbIdx)]
                            ).length,
                        0,
                    );
                    return (
                        <Button
                            key={i}
                            onClick={() => handleSectionTab(i)}
                            variant={`${activeSection === i ? 'save' : 'ghost'}`}
                        >
                            <span>Section {i + 1}</span>
                            <span className={`flex items-center gap-1 text-xs font-normal ${
                                done === sectionRows ? "text-lime-400" : "text-base-content/40"
                            }`}>
                                <ChevronRight className="h-3 w-3" />
                                {done}/{sectionRows}
                            </span>
                        </Button>
                    );
                })}
            </footer>
        </div>
    );
};

export default ReadMudExam;