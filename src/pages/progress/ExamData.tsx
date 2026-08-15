import { RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "../../ui/UI.tsx";
import type { IELTSCard, Status } from "../../testEditor/card/carde.ts";
import { useCallback, useState, useEffect } from "react";
import { useToast } from "../../ui/index.ts";
import { userService } from "../../context/authService.ts";
import ExamCard from "./ExamCard.tsx";
import { ToastBanner } from "../../ui/Toest.tsx";

// ✅ Filter state for published exams only
interface FilterState {
    status: string;
}

const EMPTY_FILTERS: FilterState = {
    status: "published",
};

// ─── Mock data helper (replace with actual API call) ───────────────
const getExamMetadata = (card: IELTSCard) => ({
    durationMinutes: card.metadata?.estimatedDuration ?? 120,
    sections: 3,
    parts: 4,
    tasks: 2,
    completedSkills: [] as any[], // ← Fetch from exam session API
});

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExamData() {
    const [cards, setCards] = useState<IELTSCard[]>([]);
    //const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(5);

    const [filters] = useState<FilterState>(EMPTY_FILTERS);

    const [cardLoading, setCardLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    const { toast, show: showToast } = useToast();

    const LIMIT = 12;

    // ─── Load published exam cards ──────────────────────────────────────
    const loadCards = useCallback(async () => {
        setCardLoading(true);
        setListError(null);
        try {
            const params = {
                page,
                limit: LIMIT,
                status: filters.status as Status,
            };
            const res = await userService.fetchCards(params);
            setCards(res.data);
            //setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            const errorMsg = (err as Error).message;
            setListError(errorMsg);
            showToast(errorMsg, "ERROR");
        } finally {
            setCardLoading(false);
        }
    }, [page, filters, showToast]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    // ─── Handlers ──────────────────────────────────────────────────────────
    const handleTakeExam = (cardId: string) => {
        // TODO: Navigate to exam or open exam session
        // Example: navigate(`/exam/take/${cardId}`);
        console.log("Starting exam:", cardId);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Toast notification */}
                <ToastBanner toast={toast} />

                {/* Page header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 mb-1">Available Exams</h1>
                        <p className="text-sm text-slate-500">Choose an exam to practice</p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadCards}
                        loading={cardLoading}
                        label="Refresh"
                        icon={<RefreshCw size={16} className={cardLoading ? "animate-spin" : ""} />}
                    />
                </div>

                {/* Error state */}
                {listError && (
                    <div className="flex items-center gap-3 bg-rose-950/60 border border-rose-700/50 text-rose-300 text-sm px-5 py-3.5 rounded-2xl mb-6">
                        <AlertCircle size={16} />
                        <span className="flex-1">{listError}</span>
                        <Button
                            onClick={loadCards}
                            label="Retry"
                            variant="reset"
                        />
                    </div>
                )}

                {/* Loading state */}
                {cardLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={32} className="text-indigo-400 animate-spin" />
                        <span className="text-sm text-slate-500 uppercase tracking-widest font-semibold">
                            Loading exams…
                        </span>
                    </div>
                ) : cards.length === 0 ? (
                    /* Empty state */
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
                        <p className="text-sm font-semibold text-slate-500">No exams available</p>
                        <p className="text-xs">Check back later for new exam cards</p>
                    </div>
                ) : (
                    <>
                        {/* Exam grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                            {cards.map((card) => {
                                const metadata = getExamMetadata(card);
                                return (
                                    <ExamCard
                                        key={card._id}
                                        card={card}
                                        durationMinutes={metadata.durationMinutes}
                                        sections={metadata.sections}
                                        parts={metadata.parts}
                                        tasks={metadata.tasks}
                                        completedSkills={metadata.completedSkills}
                                        onTakeExam={handleTakeExam}
                                    />
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 5 && (
                            <div className="flex items-center justify-center gap-3 mt-8">
                                <button
                                    disabled={page <= 1 || cardLoading}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest
                                            border border-slate-700 text-slate-400
                                            hover:text-slate-200 hover:bg-slate-800 transition-all
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    ← Previous
                                </button>
                                <span className="text-sm text-slate-500 font-semibold tracking-widest">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages || cardLoading}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className="px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-widest
                                            border border-slate-700 text-slate-400
                                            hover:text-slate-200 hover:bg-slate-800 transition-all
                                            disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}