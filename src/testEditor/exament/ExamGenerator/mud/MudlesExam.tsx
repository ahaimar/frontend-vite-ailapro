import { useNavigate, useParams } from "react-router";
import type { WriteTest } from "../../../writeTask/writeDTO";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useToast } from "../../../../ui";
import { userService } from "../../../../context/authService";
import { Button } from "../../../../ui/UI";
import { ToastBanner } from "../../../../ui/Toest";
import WordCountBadge from "../../utils/WordCountBadge";
import HeaderForm from "../Index";

const TASK_CONFIG = [
    { label: "Writing Task 1", minutes: 20, minWords: 150, seconds: 20 * 60 },
    { label: "Writing Task 2", minutes: 40, minWords: 250, seconds: 40 * 60 },
] as const;


const countWords = (text: string): number =>
    text.trim() ? text.trim().split(/\s+/).length : 0;


const MudelsExam: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [test,        setTest       ] = useState<WriteTest | null>(null);
    const [activeIndex, setActiveIndex] = useState <0 | 1>(0);
    const [answers,     setAnswers    ] = useState<[string, string]>(["", ""]);
    const [timeLeft,    setTimeLeft   ] = useState(TASK_CONFIG[0].seconds);
    const [submitting,  setSubmitting ] = useState(false);
    const [submitted,   setSubmitted  ] = useState(false);
    const [loading,     setLoading    ] = useState(true);

    const { toast, show: showToast } = useToast();
    const answersRef   = useRef<[string, string]>(answers);
    answersRef.current = answers;
    const timeSpentRef = useRef<[number, number]>([0, 0]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        userService.getWriteTaskById(id)
            .then(res => {
                if (!res.success) throw new Error(res.message ?? "Test not found");
                setTest(res.data as WriteTest);
                setAnswers(["", ""]);
            })
            .catch((err: unknown) => showToast(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Failed to load test", "ERROR",
            ))
            .finally(() => setLoading(false));
    }, [id, showToast]);

    // ── Timer ─────────────────────────────────────────────────────────────────

    useEffect(() => { setTimeLeft(TASK_CONFIG[activeIndex].seconds); }, [activeIndex]);

    useEffect(() => {
        if (submitted) return;
        const iv = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(iv);
                    showToast(`Time's up for ${TASK_CONFIG[activeIndex].label}!`, "WARNING");
                    return 0;
                }
                timeSpentRef.current[activeIndex] += 1;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [activeIndex, submitted, showToast]);

    // Add to WritingExam component
    useEffect(() => {
    const preventKeys = (e: KeyboardEvent) => {
        // Block Ctrl+F (find)
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        showToast("Search is disabled during the exam", "WARNING");
        }
        // Block Ctrl+V (paste)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        showToast("Paste is disabled during the exam", "WARNING");
        }
    };

    if (!submitted) {
        document.addEventListener('keydown', preventKeys);
        return () => document.removeEventListener('keydown', preventKeys);
    }
    }, [submitted, showToast]);

    // ── Task switch ───────────────────────────────────────────────────────────

    const switchTask = useCallback((next: 0 | 1) => {
        if (next === activeIndex) return;
        const wc  = countWords(answersRef.current[activeIndex]);
        const min = TASK_CONFIG[activeIndex].minWords;
        if (wc < min) showToast(
            `Task ${activeIndex + 1} has ${wc} words (min ${min}). You can still continue.`, "WARNING",
        );
        setActiveIndex(next);
    }, [activeIndex, showToast]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!test || !id || submitting) return;
        const [t1, t2]  = answersRef.current;
        const taskCount = test.tasks.length;

        if (taskCount >= 1 && countWords(t1) < TASK_CONFIG[0].minWords) {
            showToast(`Task 1 needs at least ${TASK_CONFIG[0].minWords} words (you have ${countWords(t1)}).`, "WARNING");
            return;
        }
        if (taskCount >= 2 && countWords(t2) < TASK_CONFIG[1].minWords) {
            showToast(`Task 2 needs at least ${TASK_CONFIG[1].minWords} words (you have ${countWords(t2)}).`, "WARNING");
            return;
        }

        const testData = test.tasks.map((task, i) => ({
            questionNumber: `Q${i + 1}`,
            questionBody:   task.question,
            userAnswer:     answersRef.current[i] ?? "",
            correctAnswer:  "",
        }));

        setSubmitting(true);
        try {
            const data = await userService.CreateSession({
                testRef:   test._id,     // FIX: was `test` — field renamed in updated service
                // TODO : should we add type of exam attrebiot in futer
                testModel: "Writing",
                testData,
                timeSpent: timeSpentRef.current.reduce((a, b) => a + b, 0),
            });
            console.log("Session created:", data.data);
            setSubmitted(true);
            showToast("Test submitted successfully!", "SUCCESS");
        } catch (err: unknown) {
            showToast("An error occurred while creating the session", "ERROR");
            console.error(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Failed to submit. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    }, [test, id, submitting, showToast]);

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
            <h2 className="text-2xl font-bold">Writing submitted!</h2>
            <p className="text-base-content/60">Your response has been saved and scored.</p>
            <Button
                label={'to menu page'}
                variant="primary"
                icon={<ArrowRight size={18} />}
                onClick={() => navigate('/menu/exam')}
            />
        </div>
    );

    const currentTask = test.tasks[activeIndex];
    if (!currentTask) return (
        <div className="alert alert-error m-10 w-auto">
            <AlertCircle className="h-5 w-5" /> This test has no tasks configured.
        </div>
    );

    const wordCount = countWords(answers[activeIndex]);
    const minWords  = TASK_CONFIG[activeIndex].minWords;

    return (
        <div className="flex flex-col h-screen bg-slate-800 overflow-hidden w-full">
            <ToastBanner toast={toast} />

            <>
                            <HeaderForm
                                config={{
                                    typeLabel: "IELTS Witeing",
                                    title: test.title,
                                    topic: test.metadata?.topic
                                }}
                                telemetry={{
                                    timeLeft: timeLeft,
                                    answered: 1,
                                    total: 0
                                }}
                                submitting={submitting}
                                onSubmit={handleSubmit}
                            />
            </>

            <main className="flex flex-1 overflow-hidden">
                {/* Prompt panel */}
                <div className="w-1/2 overflow-y-auto p-6 border-r border-base-300 bg-base-50">
                    <p className="text-md font-bold mb-1 capitalize pt-2">{test.description}</p>
                    <p className="text-sm text-base-content mb-4 italic">{currentTask.description}</p>
                    <p className="text-sm text-base-content mb-6">{currentTask.question}</p>
                    {currentTask.diagram_url && (
                        <fieldset className="fieldset w-full mb-4 p-1 h-auto">
                            <legend className="fieldset-legend">Diagram</legend>
                            <img
                                src={currentTask.diagram_url}
                                className="max-w-sm rounded-lg shadow-2xl"
                                alt="Task diagram"
                            />
                        </fieldset>
                    )}
                </div>

                {/* Answer panel */}
                <div className="w-1/2 flex flex-col p-8 gap-4 text-base-content">
                    <div className="flex-1 flex flex-col">
                        <textarea
                            className="textarea textarea-bordered flex-1 text-base leading-relaxed
                                       focus:outline-primary w-full resize-none bg-slate-800"
                            placeholder="Write your answer here…"
                            value={answers[activeIndex]}
                            onPaste={e => e.preventDefault()}
                            disabled={submitted}
                            onChange={e => setAnswers(prev => {
                                const next: [string, string] = [...prev] as [string, string];
                                next[activeIndex] = e.target.value;
                                return next;
                            })}
                        />
                        <div className="flex justify-between items-center mt-3">
                            <WordCountBadge count={wordCount} min={minWords} />
                            <span className="text-xs text-base-content/40">
                                Min. {minWords} words required
                                {currentTask.wordMax ? ` · max ${currentTask.wordMax}` : ""}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="flex border-t border-base-300 bg-base-100">
                {test.tasks.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => switchTask(i as 0 | 1)}
                        className={`flex-1 py-4 font-bold border-t-2 transition-all text-white ${
                            activeIndex === i
                                ? "border-indigo-500 bg-indigo-500/10 text-indigo-400"
                                : "border-transparent bg-lime-950 hover:bg-lime-900/90 text-base-content/50"
                        }`}
                    >
                        {TASK_CONFIG[i]?.label ?? `Task ${i + 1}`}
                    </button>
                ))}
            </footer>
        </div>
    );
};


export default MudelsExam;