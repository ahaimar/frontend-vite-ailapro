import { useEffect } from "react";
import { useTestCorrection } from "./useTestCorrection";
import { Button } from "../../ui/UI";

interface TestCorrectionViewProps {
    testRef?: string;
    /** Optional label shown in the header, e.g. "Writing" — falls back to data.testModel */
    label?: string;
    /** Called whenever the loaded score changes (including null when there's no score yet). */
    onScoreChange?: (score: number | null) => void;
}

export function TestCorrectionView({ testRef, label, onScoreChange }: TestCorrectionViewProps) {
    const { data, loading, error, refetch } = useTestCorrection(testRef);
    
    useEffect(() => {
        onScoreChange?.(data?.score ?? null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data?.score]);

    if (!testRef) {
        return (
            <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-4">
                <p className="text-xs text-slate-500">
                    {label ? `${label}: ` : ""}No correction available yet.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-4">
                <p className="text-xs text-slate-500">Loading {label?.toLowerCase() ?? "test"} correction…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-rose-700/50 bg-rose-900/20 p-4">
                <p className="text-xs text-rose-300">Error: {error}</p>
                <button
                    onClick={refetch}
                    className="mt-2 rounded bg-rose-700 px-3 py-1 text-xs font-semibold text-white hover:bg-rose-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="rounded-lg border border-slate-700/60 bg-slate-800/30 p-4">
                <p className="text-xs text-slate-500">No test correction found.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 rounded-lg border border-slate-700/60 bg-slate-800/30 p-4">
            <header className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-slate-100">
                        {label ?? data.testModel}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                        Status: <span className="font-semibold">{data.status}</span>
                        {data.score != null && <> · Score: {data.score}</>}
                    </p>
                </div>
                <Button
                    onClick={refetch}
                    label='Refresh'
                    variant="ghost"
                />
            </header>

            <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                    <p className="text-slate-500">Time spent</p>
                    <p className="text-slate-200">{data.timeSpent}s</p>
                </div>
                <div>
                    <p className="text-slate-500">Accuracy</p>
                    <p className="text-slate-200">
                        {data.accuracy != null ? `${(data.accuracy * 100).toFixed(1)}%` : "—"}
                    </p>
                </div>
            </div>

            {data.testData?.length > 0 && (
                <div>
                    <h5 className="mb-1 text-[11px] font-semibold text-slate-400">Questions</h5>
                    <ul className="divide-y divide-slate-700/50 text-[11px]">
                        {data.testData.map((q) => (
                            <li key={q.questionNumber} className="flex items-start justify-between py-1.5">
                                <div>
                                    <p className="font-medium text-slate-200">Q{q.questionNumber}</p>
                                    {q.explanation && <p className="text-slate-500">{q.explanation}</p>}
                                </div>
                                <span
                                    className={
                                        q.scoreRaw >= 1
                                            ? "rounded bg-emerald-900/50 px-2 py-0.5 text-emerald-300"
                                            : "rounded bg-rose-900/50 px-2 py-0.5 text-rose-300"
                                    }
                                >
                                    {q.scoreRaw}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {data.weakQuestions && data.weakQuestions.length > 0 && (
                <div>
                    <h5 className="mb-1 text-[11px] font-semibold text-slate-400">Weak Areas</h5>
                    <p className="text-[11px] text-slate-400">{data.weakQuestions.join(", ")}</p>
                </div>
            )}
        </div>
    );
}

export default TestCorrectionView;