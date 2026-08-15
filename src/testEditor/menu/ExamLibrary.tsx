import { useCallback, useEffect, useMemo, useState } from "react";
import type { AccessType, Difficulty, IELTSCard, Status, TestType } from "../card/carde.ts";
import { userService } from "../../context/authService.ts";
import type { FilterState } from "../card/CardManager.tsx";
import { AlertCircle, LayoutGrid, RefreshCw} from "lucide-react";
import { Button } from "../../ui/UI.tsx";
import { UserCardItem } from "./UserCardItem.tsx";
import ExamItem from "../a1/menu icon-14.png";

// ─── Constants ───────────────────────────────────────────────────────────────

const LIMIT = 9;

const EMPTY_FILTERS: FilterState = {
    status: "",
    testType: "",
    accessType: "",
    difficulty: "",
};

// ─── Types ────────────────────────────────────────────────────────────────────


function SkeletonCard() {
    return (
        <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-3 animate-pulse">
            <div className="flex gap-2">
                <div className="h-5 w-16 rounded-full bg-slate-700/60" />
                <div className="h-5 w-12 rounded-full bg-slate-700/60" />
            </div>
            <div className="h-4 w-3/4 rounded bg-slate-700/60" />
            <div className="h-3 w-1/2 rounded bg-slate-700/60" />
            <div className="h-px bg-slate-700/40 my-1" />
            <div className="flex gap-4">
                <div className="h-3 w-10 rounded bg-slate-700/60" />
                <div className="h-3 w-10 rounded bg-slate-700/60" />
            </div>
            <div className="h-8 w-full rounded-xl bg-slate-700/60 mt-1" />
        </div>
    );
}

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-600" role="status">
            <LayoutGrid size={40} strokeWidth={1} aria-hidden="true" />
            <div className="text-center">
                <p className="text-sm font-semibold text-slate-500">No tests found</p>
                <p className="text-xs mt-1">
                    {hasFilters ? "Try adjusting your filters" : "No tests are available yet"}
                </p>
            </div>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExamLibrary() {
    const [cards, setCards]           = useState<IELTSCard[]>([]);
    const [total, setTotal]           = useState(0);
    const [page, setPage]             = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters]       = useState<FilterState>(EMPTY_FILTERS);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError]   = useState<string | null>(null);

    // Derived state ────────────────────────────────────────────────────────────

    const hasFilters = useMemo(
        () => Object.values(filters).some(Boolean),
        [filters],
    );


    // Data fetching ────────────────────────────────────────────────────────────

    const loadCards = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const params = {
                page,
                limit: LIMIT,
                ...(filters.status     && { status:     filters.status     as Status }),
                ...(filters.testType   && { testType:   filters.testType   as TestType }),
                ...(filters.accessType && { accessType: filters.accessType as AccessType }),
                ...(filters.difficulty && { difficulty: filters.difficulty as Difficulty }),
            };
            const res = await userService.fetchCards(params);
            setCards(res.data);
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            console.log(err)
            setListError((err as Error).message);
        } finally {
            setListLoading(false);
        }
    }, [page, filters]);

    useEffect(() => { loadCards(); }, [loadCards]);


    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-base-100 text-base-content">
            <div className="max-w-7xl mx-auto px-4 sm:p-2 p-2">
                {/* ── Header ── */}
                <div className="flex items-start justify-between mb-10 flex-wrap gap-1">
                    <div className="">
                        <div className="flex">
                            <img className="w-15 h-15" src={ExamItem} alt="exam icom" />
                            <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-mono tracking-tight text-base-content">
                                Exam Library
                            </h1>
                        </div>
                        </div>
                        
                        <p className="text-sm text-base-content/90 ml-12">Browse and take IELTS skill tests</p>
                        <p className="text-sm text-primary ml-12 uppercase font-medium" aria-live="polite">
                            {total} {total === 1 ? "test" : "tests"} available
                        </p>
                    </div>

                    <Button
                        label="Refresh"
                        variant="outline"
                        icon={ <RefreshCw size={12} className={listLoading ? "animate-spin" : ""} aria-hidden="true" /> }
                        onClick={loadCards}
                        loading={listLoading}
                        aria-label="Refresh card list"
                    />
                </div>

                {/* ── Error ── */}
                {listError && (
                    <>
                        <div
                            role="alert"
                            className="flex items-center gap-3 bg-rose-950/60 border border-rose-700/50 justify-between
                            text-rose-300 text-sm px-5 py-3.5 rounded-2xl mb-6"
                        >
                            <AlertCircle size={16} aria-hidden="true" />
                            {listError}
                            <Button
                                label="Retry"
                                variant="reset"
                                onClick={loadCards}
                            />
                        </div>
                    </>
                    
                )}

                {/* ── Card grid ── */}
                {listLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6" aria-busy="true" aria-label="Loading tests">
                            {Array.from({ length: LIMIT }).map((_, i) => (
                                <SkeletonCard key={i} />
                            ))}
                        </div>
                    ) : cards.length === 0 ? (
                        <EmptyState hasFilters={hasFilters} />
                    ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {cards.map((card) => (
                                <UserCardItem key={card._id} card={card} />
                            ))}
                        </div>

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <nav
                                className="flex items-center justify-center gap-2 mt-4"
                                aria-label="Pagination"
                            >
                                <Button
                                    size="sm"
                                    label="← Prev"
                                    variant="sand"
                                    loading={page <= 1 || listLoading}
                                    onClick={() => setPage((p) => p - 1)}
                                    aria-label="Previous page"
                                />
                                <span
                                    className="text-xs text-slate-500 font-semibold tracking-widest"
                                    aria-live="polite"
                                >
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    label="Next →"
                                    variant="sand"
                                    loading={page >= totalPages || listLoading}
                                    onClick={() => setPage((p) => p + 1)}
                                    aria-label="Next page"
                                />
                            </nav>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}