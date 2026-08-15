import {useState, useEffect, useCallback} from "react";
import type React from "react";
import {LayoutGrid, Plus, Filter, RefreshCw, Loader2, AlertCircle,} from "lucide-react";
import CardModal from "./CardModal";
import CardItem from "./CardItem";
import {type IELTSCard,type CardForm,type Status,type Difficulty,type TestType,type AccessType,EMPTY_FORM} from "./carde";
import {adminService} from "../../context/authService";
import {Button, Field, Select} from "../../ui/UI";
import {useToast} from "../../ui";

const StatCard: React.FC<{ label: string; value: number; accent: string }> = ({label, value, accent,}) => (
    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 flex flex-col gap-1 shadow-lg">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
        <span className={`text-3xl font-black tracking-tight ${accent}`}>{value}</span>
    </div>
);

export interface FilterState {
    status: string;
    testType: string;
    accessType: string;
    difficulty: string;
}

const EMPTY_FILTERS: FilterState = {
    status: "", testType: "", accessType: "", difficulty: "",
};

const CardManager: React.FC = () => {
    const [cards, setCards] = useState<IELTSCard[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const LIMIT = 9;

    const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<IELTSCard | null>(null);
    const [form, setForm] = useState<CardForm>(EMPTY_FORM);

    const [cardLoading, setcardLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const {toast, show: showToast} = useToast();

    const loadCards = useCallback(async () => {
        setcardLoading(true);
        setListError(null);
        try {
            const params = {
                page,
                limit: LIMIT,
                ...(filters.status && {status: filters.status as Status}),
                ...(filters.testType && {testType: filters.testType as TestType}),
                ...(filters.accessType && {accessType: filters.accessType as AccessType}),
                ...(filters.difficulty && {difficulty: filters.difficulty as Difficulty}),
            };
            const res = await adminService.fetchCards(params);
            setCards(res.data);
            setTotal(res.pagination.total);
            setTotalPages(res.pagination.totalPages);
        } catch (err) {
            setListError((err as Error).message);
            showToast((err as Error).message, "ERROR");
        } finally {
            setcardLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    // ─── Derived stats (from all cards — or keep a separate counts fetch if needed)
    const published = cards.filter((c) => c.status === "published").length;
    const drafts = cards.filter((c) => c.status === "draft").length;
    const paid = cards.filter((c) => c.accessType === "paid").length;

    const openCreate = () => {
        setEditingCard(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (card: IELTSCard) => {
        setEditingCard(card);
        setForm({
            ...card,
            writeTest:  (card.writeTest?._id ?? null) as any,
            listenTest: (card.listenTest?._id ?? null) as any,
            speakTest:  (card.speakTest?._id ?? null) as any,
            readTest:   (card.readTest?._id ?? null) as any,
            metadata: {...card.metadata,
                difficulty: card.metadata?.difficulty ?? 'Easy',
                topic: card.metadata?.topic ?? '',
                estimatedDuration: card.metadata?.estimatedDuration
            },
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        if (modalLoading) return;
        setModalOpen(false);
        setEditingCard(null);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            showToast("Title is required.", "SUCCESS");
            return;
        }
        const hasSkill = (["writing", "reading", "listening", "speaking"] as const).some(
            (s) => form.skills[s]
        );
        if (!hasSkill) {
            showToast('Link at least one skill test', "ERROR");
            return;
        }

        setModalLoading(true);
        try {
            if (editingCard) {
                const payload = {
                    title:       form.title,
                    description: form.description,
                    testType:    form.testType,
                    accessType:  form.accessType,
                    type:        form.type,
                    metadata:    form.metadata,
                    // ✅ Same mapping for updates
                    writeTest:   form.skills.writing   ?? null,
                    readTest:    form.skills.reading   ?? null,
                    listenTest:  form.skills.listening ?? null,
                    speakTest:   form.skills.speaking  ?? null,
                };
                const updated = await adminService.updateCard(editingCard._id, payload);
                setCards((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
                showToast('Update Card Success .', "SUCCESS");
            } else {
                const payload = {
                    title:       form.title,
                    description: form.description,
                    testType:    form.testType,
                    accessType:  form.accessType,
                    type:        form.type,
                    metadata:    form.metadata,
                    // ✅ Map frontend skill keys → backend field names
                    writeTest:   form.skills.writing   ?? null,
                    readTest:    form.skills.reading   ?? null,
                    listenTest:  form.skills.listening ?? null,
                    speakTest:   form.skills.speaking  ?? null,
                };
                const created = await adminService.createCard(payload);
                setCards((prev) => [created, ...prev]);
                setTotal((t) => t + 1);
                showToast('Craete Card Success .', "SUCCESS");
            }
            closeModal();
        } catch (err) {
            showToast((err as Error).message, "SUCCESS");
        } finally {
            setModalLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setBusyId(id);
        try {
            await adminService.deleteCard(id);
            setCards((prev) => prev.filter((c) => c._id !== id));
            setTotal((t) => t - 1);
            showToast('Delete Card Success .', "SUCCESS");
        } catch (err) {
            alert((err as Error).message);
            showToast((err as Error).message, "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const handlePublish = async (id: string) => {
        setBusyId(id);
        try {
            const updated = await adminService.publishCard(id);
            setCards((prev) => prev.map((c) => (c._id === id ? updated : c)));
            showToast('Update Publish Success .', "SUCCESS");
        } catch (err) {
            alert((err as Error).message);
            showToast((err as Error).message, "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const handleArchive = async (id: string) => {
        setBusyId(id);
        try {
            const updated = await adminService.archiveCard(id);
            setCards((prev) => prev.map((c) => (c._id === id ? updated : c)));
            showToast('Update Archive Success .', "SUCCESS");
        } catch (err) {
            alert((err as Error).message);
            showToast((err as Error).message, "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const setFilter = (key: keyof FilterState, value: string) => {
        setFilters((f) => ({...f, [key]: value}));
        setPage(1);
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setPage(1);
    };
    const hasFilters = Object.values(filters).some(Boolean);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {toast && (
                    <div className="toast toast-top toast-center z-500">
                        <div
                            className={`alert ${toast.status === 'SUCCESS' ? 'bg-green-950/60 border border-green-700/50 text-green-300 text-xs px-4 py-2.5 rounded-xl'
                                : 'bg-rose-950/60 border border-rose-700/50 text-rose-300 text-xs px-4 py-2.5 rounded-xl'} shadow-lg`}>
                            <span>{toast.msg}</span>

                        </div>
                    </div>
                )}

                {/* ── Page header ── */}
                <div className="flex items-start justify-between mb-10 flex-wrap gap-4 ">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div
                                className="w-10 h-10 rounded-xl bg-slate-500/20 border border-slate-500/30 flex items-center justify-center">
                                <LayoutGrid size={17} className="text-slate-400"/>
                            </div>
                            <h1 className="text-2xl font-mono tracking-tight text-slate-100">Test Cards</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-12">
                            Manage and publish bundled IELTS skill tests
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadCards}
                            disabled={cardLoading}
                            title="Refresh"
                            className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900
                                       text-slate-400 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={16} className={cardLoading ? "animate-spin" : ""} />
                        </button>
                        <Button
                            label="New card"
                            icon={<Plus size={13} />}
                            variant="primary"
                            onClick={openCreate}
                        />
                    </div>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    <StatCard label="Total" value={total} accent="text-slate-100"/>
                    <StatCard label="Published" value={published} accent="text-emerald-400"/>
                    <StatCard label="Drafts" value={drafts} accent="text-amber-400"/>
                    <StatCard label="Paid" value={paid} accent="text-indigo-400"/>
                </div>

                {/* ── Filters ── */}
                <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 mb-6 shadow-lg">
                    <div className="flex items-center gap-2 mb-4 justify-between ">
                        <div className=" flex gap-1">
                            <Filter size={13} className="text-slate-500"/>
                            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Filters</span>
                        </div>  
                        <div className="flex gap-1">
                            {hasFilters && (
                                <Button
                                    onClick={clearFilters}
                                    label="Clear all"
                                    variant="sand"
                                />
                                
                            )}
                            <div>
                                
                            </div>
                        </div>

                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <Field label="Status" htmlFor="f-status">
                            <Select
                                id="f-status"
                                value={filters.status}
                                onChange={(e) => setFilter("status", e.target.value)}
                            >
                                <option value="">All statuses</option>
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </Select>
                        </Field>

                        <Field label="Test type" htmlFor="f-testType">
                            <Select
                                id="f-testType"
                                value={filters.testType}
                                onChange={(e) => setFilter("testType", e.target.value)}
                            >
                                <option value="">All types</option>
                                <option value="mock_test">Mock test</option>
                                <option value="practice_test">Practice test</option>
                                <option value="mini_test">Mini test</option>
                            </Select>
                        </Field>

                        <Field label="Access" htmlFor="f-accessType">
                            <Select
                                id="f-accessType"
                                value={filters.accessType}
                                onChange={(e) => setFilter("accessType", e.target.value)}
                            >
                                <option value="">All access</option>
                                <option value="free">Free</option>
                                <option value="paid">Paid</option>
                            </Select>
                        </Field>

                        <Field label="Difficulty" htmlFor="f-difficulty">
                            <Select
                                id="f-difficulty"
                                value={filters.difficulty}
                                onChange={(e) => setFilter("difficulty", e.target.value)}
                            >
                                <option value="">All levels</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                                <option value="Mixed">Mixed</option>
                            </Select>
                        </Field>
                    </div>
                </div>

                {/* ── Cards grid ── */}
                {listError && (
                    <div
                        className="flex items-center gap-3 bg-rose-950/60 border border-rose-700/50 text-rose-300 text-sm px-5 py-3.5 rounded-2xl mb-6">
                        <AlertCircle size={16}/>
                        {listError}
                        <button onClick={loadCards}
                                className="ml-auto underline text-rose-400 hover:text-rose-200 text-xs">
                            Retry
                        </button>
                    </div>
                )}

                {cardLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={28} className="text-indigo-400 animate-spin"/>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                            Loading cards…
                        </span>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-600">
                        <LayoutGrid size={40} strokeWidth={1}/>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500">No cards found</p>
                            <p className="text-xs mt-1">
                                {hasFilters ? "Try adjusting your filters" : "Create your first card to get started"}
                            </p>
                        </div>
                        {!hasFilters && (
                            <button
                                onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest
                                bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 transition-all mt-2"
                            >
                                <Plus size={13}/> New card
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {cards.map((card) => (
                                <CardItem
                                    key={card?._id}
                                    card={card}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onPublish={handlePublish}
                                    onArchive={handleArchive}
                                    busy={busyId === card._id}
                                />
                            ))}
                        </div>

                        {/* ── Pagination ── */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <button
                                    disabled={page <= 1 || cardLoading}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest border border-slate-700
                                            text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-30"
                                >
                                    ← Prev
                                </button>
                                <span className="text-xs text-slate-500 font-semibold tracking-widest">
                                    {page} / {totalPages}
                                </span>
                                <button
                                    disabled={page >= totalPages || cardLoading}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-widest border border-slate-700
                                            text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-30"
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <CardModal
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onClose={closeModal}
                    isEditing={!!editingCard}
                    loading={modalLoading} error={null}/>
            )}
        </div>
    );
};

export default CardManager;