import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
    CheckCircle2, AlertCircle,
    ChevronRight, ArrowRight,
    TextSearch,
    X,
    ChevronLeft,
    GripVertical,
} from "lucide-react";
import type { FormBody, ListenTest, Passage, QuestionType } from "../../../listenTask/listenDTO";
import { useToast } from "../../../../ui";
import { userService } from "../../../../context/authService";
import type { TestData } from "../../../SessionDTO";
import { Button } from "../../../../ui/UI";
import { ToastBanner } from "../../../../ui/Toest";
import AudioPlayer from "../exam/Audio";
import type { TestCorrectionDTO } from "../CorrectionDTO";
import { EXAM_UI_COLORS } from "../CorrectionDTO";
import HeaderForm from "../Index";
import { TablePropViewer } from "../../AiGenerator/TablePrp";
import { useAuthStore } from "../../../../context/authStore";

type AnswerMap = Record<string, string>;

const rowKey = (sIdx: number, aIdx: number, fbIdx: number) =>
    `${sIdx}-${aIdx}-${fbIdx}`;

const totalRows = (passages: Passage[]): number =>
    passages.reduce((acc, s) =>
        acc + s.questions.reduce((a2, ans) => a2 + (ans.formBody?.length ?? 1), 0), 0,
    );

const totalAnswered = (map: AnswerMap): number =>
    Object.values(map).filter(Boolean).length;

const resolveOptions = (_type: QuestionType, row: FormBody): string[] => row.options ?? [];

const isFreeText = (type: QuestionType): boolean =>
    type === "form_completion" || type === "sentence_completion";


const QuestionGrid: React.FC<{
    passages: Passage[];
    answers: AnswerMap;
    activePassageIdx: number;
}> = ({ passages, answers, activePassageIdx }) => (
    <div className="p-4 flex flex-col gap-4 overflow-y-auto">
        {passages.map((passage, sIdx) => (
            <div key={sIdx}>
                <p className="text-[10px] uppercase tracking-widest text-base-content/40 font-medium mb-2">
                    Passage {sIdx + 1}
                </p>
                <div className="grid grid-cols-4 gap-1">
                    {passage.questions?.flatMap((ans, aIdx) =>
                        (ans.formBody ?? [{ question: "" } as FormBody]).map((_, fbIdx) => {
                            const key  = rowKey(sIdx, aIdx, fbIdx);
                            const done = !!answers[key];
                            const num  = passage.questions
                                ?.slice(0, aIdx)
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
                                            : sIdx === activePassageIdx
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
                    value ? EXAM_UI_COLORS.answerCorrect : 'border-base-300 bg-base-100'
                }`}
        >
            <div className="flex items-start gap-3">
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                        text-xs font-bold ${
                        value ? "bg-lime-600 text-white" : "bg-base-300 text-base-content/60"
                    }`}
                >
                    {qNum}
                </span>

                <div className="flex-1 min-w-0">
                    {row.instructions && (
                        <p className="text-xs text-base-content/50 italic mb-1">{row.instructions}</p>
                    )}
                    <p className="text-sm text-base-content leading-relaxed mb-2">
                        {row.question}
                    </p>

                    {row.diagram_url && (
                        <fieldset className="fieldset w-full mb-4 p-1 h-auto">
                            <img
                                src={row.diagram_url}
                                className="max-w-sm rounded-lg shadow-2xl"
                                alt="Task diagram"
                            />
                        </fieldset>
                    )}

                    {
                        row.tableProp && (
                            <TablePropViewer
                                // Rehydrate any previously saved answer (e.g. coming back to
                                // this question, or viewing results) back onto the table.
                                tableProp={
                                    value
                                        ? { ...row.tableProp, rows: JSON.parse(value) }
                                        : row.tableProp
                                }
                                option={row.options}
                                disabled={disabled}
                                onChange={(updatedTable) => onChange(key, JSON.stringify(updatedTable.rows))}
                            />
                        )
                    }

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
                            {type !== 'table' &&
                                <>
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
                                </>
                            }
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

const PassagePanel: React.FC<{
    passage:  Passage;
    sIdx:     number;
    answers:  AnswerMap;
    onChange: (key: string, val: string) => void;
    disabled: boolean;
}> = ({ passage, sIdx, answers, onChange, disabled }) => (
    <div className="flex flex-col gap-3">
        <div className="sticky bg-base-100 pb-2 pt-1">
            <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest mb-0.5">
                Passage {sIdx + 1}
            </p>
            {passage.explanation && (
                <p className="text-xs text-base-content/50 italic mt-1 leading-relaxed">
                    {passage.explanation}
                </p>
            )}
        </div>

        {passage.questions.map((answer, aIdx) => {
            const type = answer.formType ?? "form_completion";
            return (answer.formBody ?? []).map((row, fbIdx) => {
                const priorRows    = passage.questions
                    .slice(0, aIdx)
                    .reduce((acc, curr) => acc + (curr.formBody ?? []).length, 0);
                const currentQNum  = priorRows + fbIdx + 1;
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
  test: ListenTest;
  correction: TestCorrectionDTO | null;
}

const formatDuration = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
};

// ── Modal Component ────────────────────────────────────────────────────────
export const ModelResult: React.FC<ModelResultProps> = ({ modalRef, test, correction }) => {
  const handleClose = () => modalRef.current?.close();

  if (!test || !test?.passages) {
    return null;
  }

  const isScoring  = !correction || correction.status === "scoring";
  const isFailed   = correction?.status === "failed";
  const isComplete = correction?.status === "completed";

  // Group flat testData back into passages, in submission order.
  const passagesWithResults = test.passages.map((passage, sIdx) => {
    const rowsInSection = passage.questions.reduce(
      (a, b) => a + (b.formBody?.length ?? 1), 0,
    );
    const priorRows = test.passages
      .slice(0, sIdx)
      .reduce((acc, p) => acc + p.questions.reduce((a, b) => a + (b.formBody?.length ?? 1), 0), 0);

    const rows = correction?.testData.slice(priorRows, priorRows + rowsInSection) ?? [];
    const correctCount = rows.filter(r => r.scoreRaw === 1).length;

    return { passage, rows, correctCount, rowsInSection };
  });

  return (
    <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
      <div className="modal-box max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Listening Results</h3>
          <Button
            onClick={handleClose}
            variant="ghost"
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
                <span className="text-base-content/60">Parts completed:</span>{' '}
                <span className="font-semibold">{test.passages.length}</span>
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

          {/* Part breakdown */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-base-content/70 uppercase tracking-wide">
              Part Scores
            </h4>
            <div className="space-y-2">
              {passagesWithResults.map(({ passage, correctCount, rowsInSection }, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                  <span className="text-sm font-medium">Part {passage.partNumber}</span>
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
          <Button label="Close" variant="ghost" onClick={handleClose} />
        </div>
      </div>

      {/* Click backdrop to close */}
      <form method="dialog" className="modal-backdrop">
        <button className="bg-slate-950/10" />
      </form>
    </dialog>
  );
};

const ListenMudExam: React.FC = () => {

    const {user} = useAuthStore();

    const { id } = useParams<{ id: string }>();
    
    const navigate = useNavigate();
    
    const [test,          setTest         ] = useState<ListenTest | null>(null);
    const [answers,       setAnswers      ] = useState<AnswerMap>({});
    const [timeLeft,      setTimeLeft     ] = useState(60 * 60);
    const [activeSection, setActiveSection] = useState(0);
    const [submitting,    setSubmitting   ] = useState(false);
    const [submitted,     setSubmitted    ] = useState(false);
    const [loading,       setLoading      ] = useState(true);
    const [audioError,    setAudioError   ] = useState(false);

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

    const { toast, show: showToast } = useToast();
    const answersRef       = useRef(answers);
    answersRef.current     = answers;
    const passagePanelRef  = useRef<HTMLDivElement>(null);
    const questionPanelRef = useRef<HTMLDivElement>(null);

    const modalRef = useRef<HTMLDialogElement>(null);
    const [correction, setCorrection] = useState<TestCorrectionDTO | null>(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const handleMove = (clientY: number, clientX: number) => {
            if (!isDraggingRef.current) return;

            if (window.innerWidth < 768) {
            const newHeight = window.innerHeight - clientY;
            if (newHeight > 100 && newHeight < window.innerHeight * 0.6) {
                setBottomHeight(newHeight);
            }
            } else {
            const newWidth = window.innerWidth - clientX;
            if (newWidth > 150 && newWidth < window.innerWidth * 0.5) {
                setRightWidth(newWidth);
            }
            }
        };

        // Use Native DOM Event types here
        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY, e.clientX);
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
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

    // ── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        userService.getListenTaskById(id)
            .then(res => {
                if (!res.success) throw new Error(res.message ?? "Test not found");
                const data: ListenTest = res.data;
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
        test.passages.forEach((_, i) => {
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
        const total = totalRows(test.passages);
        const done  = totalAnswered(ans);

        if (done < total) {
            const unanswered = total - done;
            showToast(
                `${unanswered} question${unanswered > 1 ? "s" : ""} left unanswered. Submit anyway?`,
                "WARNING",
            );
        }

        const testData: TestData[] = test.passages.flatMap((passage, sIdx) =>
            passage.questions.flatMap((answer, aIdx) =>
                (answer.formBody ?? []).map((row, fbIdx) => ({
                    questionNumber: `Q${
                        passage.questions
                            .slice(0, aIdx)
                            .reduce((a, b) => a + (b.formBody?.length ?? 1), 0) + fbIdx + 1
                    }`,
                    explanation:   row.explanation ?? "",
                    questionBody:  row.question,
                    userAnswer:    ans[rowKey(sIdx, aIdx, fbIdx)] ?? "",
                    correctAnswer: row.correctAnswer ?? "",
                    scoreRaw:      ans[rowKey(sIdx, aIdx, fbIdx)] === row.correctAnswer ? 1 : 0,
                })),
            ),
        );

        const durationSec = (test.metadata?.estimatedDuration ?? 60) * 60;

        setSubmitting(true);
        try {
            // inside handleSubmit's try block
            const res = await userService.CreateSession({
                testRef:   test._id as string,
                testModel: "Listening",
                testData,
                timeSpent: durationSec - timeLeft,
            });
            setSubmitted(true);
            showToast("Test submitted successfully!", "SUCCESS");
            setCorrection(res?.data);
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

    if (submitted) return (
        <div className="flex h-screen flex-col items-center justify-center gap-4 text-base-content">
            <CheckCircle2 className="h-16 w-16 text-success" />
            <h2 className="text-2xl font-bold">Listening submitted!</h2>
            <p className="text-base-content/60">Your answers have been recorded.</p>
            <div className="flex gap-2">
                <Button
                    label="To menu page"
                    variant="primary"
                    icon={<ArrowRight size={18} />}
                    onClick={() => navigate("/menu/exam")}
                />
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
    const total    = totalRows(test.passages);

    const startResize = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
        e.preventDefault();
        isDraggingRef.current = true;
        document.body.style.cursor = isMobile ? "row-resize" : "col-resize";
        document.body.style.userSelect = "none";
    };

    return (
        <div className="flex flex-col h-screen bg-base-100 overflow-hidden w-full">
            <ToastBanner toast={toast} />

            <>
                <HeaderForm
                    config={{
                        typeLabel: "IELTS listening",
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

            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar — question grid */}
                <aside
                    className={`bg-base-200 transition-all duration-300 overflow-hidden shrink-0
                        ${isLeftCollapsed
                            ? 'h-0 md:h-auto w-full md:w-0 p-0'   // Collapse smoothly on either axis
                            : 'w-full md:w-1/8 p-1'
                        }`}
                >
                    <QuestionGrid
                        passages={test.passages}
                        answers={answers}
                        activePassageIdx={activeSection}
                    />
                </aside>

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
                
                {/* Audio + transcript */}
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

                        {test.audio_url ? (
                            <div className="mb-4">
                                {audioError ? (
                                    <p className="text-sm text-error">Audio could not be loaded.</p>
                                ) : (
                                    <AudioPlayer
                                        src={test.audio_url as string}
                                        onError={() => setAudioError(true)}
                                    />
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-base-content/40 italic mb-4">No audio available for this test.</p>
                        )}

                        {/*test.transcript && (
                            <p className="text-sm leading-relaxed text-base-content/80 whitespace-pre-line">
                                {test.transcript}
                            </p>
                        )*/}
                    </div>
                </div>

                {/* Divider 2: Drag Handle (Works for click or touch) */}
            
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

                {/* Questions */}
                <div
                    ref={questionPanelRef}
                    className={`overflow-auto p-6 w-full ${isMobile ? 'bg-base-100' : 'bg-base-200 md:w-80'}`}
                    style={isMobile ? { height: `${bottomHeight}px` } : { width: `${rightWidth}px` }}
                >
                    {test.passages.map((passage, sIdx) => (
                        <div key={sIdx} id={`section-${sIdx}`} data-section={sIdx}>
                            <PassagePanel
                                passage={passage}
                                sIdx={sIdx}
                                answers={answers}
                                onChange={handleAnswer}
                                disabled={submitted}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer — section tabs */}
            <footer 
                className={`border-t border-base-300/90 shrink-0 items-center justify-center p-2 gap-3  ${
                    window.innerWidth < 768 ? 'grid grid-cols-3 gap-0 h-16' : 'flex'
                }`}
            >
                {test.passages.map((passage, i) => {
                    const sectionRows = passage.questions.reduce(
                        (a, b) => a + (b.formBody?.length ?? 1), 0,
                    );
                    const done = passage.questions.reduce(
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
                            size="sm"
                        >
                            <span>Passage {i + 1}</span>
                            <span className={`text-xs font-normal ${
                                done === sectionRows ? "text-success" : "text-base-content/50"
                            }`}>
                                {done}/{sectionRows}
                            </span>
                        </Button>
                    );
                })}
            </footer>
        </div>
    );
};

export default ListenMudExam;

