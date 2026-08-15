import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, RefreshCw, Loader2, Volume2 } from "lucide-react";
import {
    type ListenForm,
    type ListenListItem,
    type ListenTest,
    EMPTY_FORM,
    LIMITS,
    syncTotalQuestions,
} from "./listenDTO.ts";
import { adminService } from "../../context/authService";
import { useToast } from "../../ui";
import { Button } from "../../ui/UI.tsx";
import { ToastBanner } from "../../ui/Toest.tsx";
import ListenModal from "./ListenModal.tsx";
import ListenItem from "./ListenItem.tsx";
import { apiMessage } from "../index.ts";
import Filters, { type FiltersValue } from "../Filters.tsx";
import { AppError } from "../../context/excaption/AppError.ts";

export type DiagramFileMap = Record<string, File>;

const EMPTY_FILTERS: FiltersValue = { search: '', status: null, level: null, type: null };

const ListenManager: React.FC = () => {
    const [form, setForm]                   = useState<ListenForm>(EMPTY_FORM);
    const [filters, setFilters]             = useState<FiltersValue>(EMPTY_FILTERS);
    const [editingCard, setEditingCard]     = useState<ListenTest | null>(null);
    const [tests, setTests]                 = useState<ListenListItem[]>([]);
    const [loading, setLoading]             = useState(false);
    const [modalLoading, setModalLoading]   = useState(false);
    const [modalOpen, setModalOpen]         = useState(false);
    const [busyId, setBusyId]               = useState<string | null>(null);
    const [diagramFiles, setDiagramFiles]   = useState<DiagramFileMap>({});

    const { toast, show: showToast } = useToast();

    const resetForm = useCallback(() => {
        setForm(EMPTY_FORM);
        setEditingCard(null);
        setDiagramFiles({});
    }, []);

    const closeModal = useCallback(() => {
        if (modalLoading) return;
        setModalOpen(false);
        resetForm();
    }, [modalLoading, resetForm]);

    const openCreate = useCallback(() => {
        resetForm();
        setModalOpen(true);
    }, [resetForm]);

    const setDiagramFile = useCallback((pi: number, qi: number, ri: number, file: File | null) => {
        const key = `${pi}_${qi}_${ri}`;
        setDiagramFiles(prev => {
            const next = { ...prev };
            if (file) next[key] = file;
            else delete next[key];
            return next;
        });
    }, []);

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...(filters.status && filters.status !== null && { status: filters.status }),
                ...(filters.level  && { level: filters.level }),
                ...(filters.type   && { type: filters.type }),
            };
            const res = await adminService.getListenTask(params);
            setTests(res.data);
        } catch (err) {
            showToast("Failed to load listening tests", "ERROR");
            throw new AppError(`Failed to load listening tests :: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [filters, showToast]);

    useEffect(() => { loadTests(); }, [loadTests]);

    const openEdit = useCallback(async (item: ListenListItem) => {
        if (!item._id) return;
        setLoading(true);
        try {
            const res = await adminService.getListenTaskById(item._id);
            const full: ListenTest = res.data;
            setForm(syncTotalQuestions(full as ListenForm));
            setEditingCard(full);
            setDiagramFiles({});
            setModalOpen(true);
        } catch (err) {
            showToast(apiMessage(err, "Failed to load test details"), "ERROR");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    /** FIX: read from `synced` param, not the outer `form` closure — previously
     *  frozen at mount because deps were `[]`, so edits to metadata/settings/
     *  access/visibility/stats never actually reached the server. */
    const buildFormData = useCallback((synced: ListenForm, diagramFiles: DiagramFileMap): FormData => {
        const fd = new FormData();
        fd.append("title",       synced.title);
        fd.append("description", synced.description ?? "");
        fd.append("transcript",  synced.transcript);
        fd.append("status",      synced.status ?? "draft");
        fd.append("passages",    JSON.stringify(synced.passages));

        if (synced.metadata)   fd.append("metadata", JSON.stringify(synced.metadata));
        if (synced.settings)   fd.append("settings", JSON.stringify(synced.settings));
        if (synced.access)     fd.append("access", JSON.stringify(synced.access));
        if (synced.visibility) fd.append("visibility", JSON.stringify(synced.visibility));
        if (synced.stats)      fd.append("stats", JSON.stringify(synced.stats));

        if (synced.audio_url instanceof File) {
            fd.append("audio", synced.audio_url);
        }

        Object.entries(diagramFiles).forEach(([key, file]) => {
            fd.append(`diagram_${key}`, file);
        });

        return fd;
    }, []);

    const handleSave = useCallback(async () => {
        if (form.title.trim().length < LIMITS.TITLE_MIN) {
            showToast(`Title must be at least ${LIMITS.TITLE_MIN} characters.`, "WARNING");
            return;
        }
        if (form.transcript.length < LIMITS.TRANSCRIPT_MIN) {
            showToast(`Transcript is too short (${form.transcript.length}/${LIMITS.TRANSCRIPT_MIN} chars).`, "WARNING");
            return;
        }
        if (form.passages.length < LIMITS.PASSAGES_MIN || form.passages.length > LIMITS.PASSAGES_MAX) {
            showToast(`Test must have ${LIMITS.PASSAGES_MIN}–${LIMITS.PASSAGES_MAX} passages.`, "WARNING");
            return;
        }
        for (let p = 0; p < form.passages.length; p++) {
            const rows = form.passages[p].questions.flatMap((a) => a.formBody);
            const filled = rows.filter((r) => r.question.trim().length > 0);
            if (filled.length === 0) {
                showToast(`Passage ${p + 1} has no questions filled in.`, "WARNING");
                return;
            }
        }

        const isCreating = !editingCard?._id;
        if (isCreating && !(form.audio_url instanceof File)) {
            showToast("Please upload an audio file.", "WARNING");
            return;
        }

        const synced = syncTotalQuestions(form);
        setModalLoading(true);

        try {
            const fd = buildFormData(synced, diagramFiles);

            if (isCreating) {
                const res = await adminService.addListenTask(fd);
                console.log(res.data);
                if (res.success) {
                    showToast("Test created successfully!", "SUCCESS");
                    await loadTests();
                    closeModal();
                } else {
                    showToast(res.message ?? res.error ?? "Failed to create test", "WARNING");
                }
            } else {
                const res = await adminService.updateListenTask(editingCard!._id!, fd);
                console.log(res.data);
                if (res.success) {
                    showToast(res.message ?? "Test updated successfully!", "SUCCESS");
                    await loadTests();
                    closeModal();
                } else {
                    showToast(res.message ?? res.error ?? "Failed to update test", "WARNING");
                }
            }
        } catch (err: unknown) {
            showToast(apiMessage(err, "Server error"), "ERROR");
        } finally {
            setModalLoading(false);
        }
    }, [form, editingCard, diagramFiles, buildFormData, loadTests, closeModal, showToast]);

    const handleDelete = useCallback(async (id: string) => {
        if (!window.confirm("Delete this test? This cannot be undone.")) return;
        setBusyId(id);
        try {
            await adminService.deleteListenTask(id);
            setTests(prev => prev.filter(t => t._id !== id));
            showToast("Test deleted successfully", "SUCCESS");
        } catch (err) {
            showToast(apiMessage(err, "Delete failed"), "ERROR");
        } finally {
            setBusyId(null);
        }
    }, [showToast]);

    const handlePublish = useCallback(async (item: ListenListItem) => {
        if (!item._id) return;
        setBusyId(item._id);
        try {
            if (item.status !== "published") {
                await adminService.publishListenTask(item._id);
                setTests(prev => prev.map(t => t._id === item._id ? { ...t, status: "published" } : t));
                showToast("Test published successfully", "SUCCESS");
            } else {
                await adminService.updateListenTask(item._id, { status: "draft" } as Partial<ListenForm>);
                setTests(prev => prev.map(t => t._id === item._id ? { ...t, status: "draft" } : t));
                showToast("Test moved back to draft", "SUCCESS");
            }
        } catch (err) {
            showToast(apiMessage(err, "Publish failed"), "ERROR");
        } finally {
            setBusyId(null);
        }
    }, [showToast]);

    const handleArchive = useCallback(async (item: ListenListItem) => {
        if (!item._id) return;
        setBusyId(item._id);
        try {
            await adminService.archiveListenTask(item._id);
            setTests(prev => prev.map(t => t._id === item._id ? { ...t, status: "archived" } : t));
            showToast("Test archived successfully", "SUCCESS");
        } catch (err) {
            showToast(apiMessage(err, "Archive failed"), "ERROR");
        } finally {
            setBusyId(null);
        }
    }, [showToast]);

    const filteredTests = tests.filter(t =>
        t.title?.toLowerCase().includes((filters.search ?? "").toLowerCase())
    );

    const hasFilters = Boolean(filters.status || filters.level || filters.type || filters.search);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <ToastBanner toast={toast} />
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30
                                        flex items-center justify-center shrink-0">
                            <Volume2 size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Listening Tests</h1>
                            <p className="text-slate-500 text-sm">
                                Manage listening passages and question sections
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={loadTests}
                            disabled={loading}
                            title="Refresh"
                            className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900
                                       text-slate-400 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                        <Button label={'New Test'} icon={<Plus size={16} />} onClick={openCreate} />
                    </div>
                </div>

                <Filters
                    value={filters}
                    onChange={setFilters}
                    showSearch
                    showStatus
                    showLevel
                    showType
                    searchPlaceholder="Search tests by title…"
                />

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Fetching tests…
                        </span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-slate-400 text-sm font-medium">
                            Showing {filteredTests.length} listening test{filteredTests.length !== 1 ? "s" : ""}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTests.map(test => (
                                <ListenItem
                                    key={test._id}
                                    listen={test}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onPublish={handlePublish}
                                    onArchive={handleArchive}
                                    busy={busyId === test._id}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!loading && filteredTests.length === 0 && (
                    <div className="text-center py-24 bg-slate-900/40 border border-dashed
                                    border-slate-800 rounded-3xl">
                        <BookOpen size={44} className="mx-auto text-slate-800 mb-4" />
                        <h2 className="text-slate-400 font-semibold">No tests found</h2>
                        <p className="text-slate-600 text-sm mt-1">
                            {hasFilters ? "Try adjusting your search or filters" : "Start by creating a new listening test"}
                        </p>
                    </div>
                )}
            </div>

            {modalOpen && (
                <ListenModal
                    form={form}
                    setForm={setForm}
                    diagramFiles={diagramFiles}
                    onDiagramFileChange={setDiagramFile}
                    onSave={handleSave}
                    onClose={closeModal}
                    isEditing={!!editingCard}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};

export default ListenManager;