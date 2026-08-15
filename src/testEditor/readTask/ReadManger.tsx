

import React, { useState, useCallback, useEffect } from "react";
import {BookOpen, Plus, RefreshCw, Loader2,} from "lucide-react";
import {
    type ReadForm,
    type ReadListItem,
    EMPTY_FORM,
    LIMITS,
} from "./readDTO.ts";

import { adminService } from "../../context/authService";
import { useToast } from "../../ui";
import ReadModal from "./ReadModal";
import {ToastBanner} from "../../ui/Toest.tsx";
import ReadItem from "./ReadItem.tsx";
import { Button } from "../../ui/UI.tsx";
import { apiMessage, type Status } from "../index.ts";
import { AppError } from "../../context/excaption/AppError.ts";
import { Filters, type FiltersValue } from "../Filters.tsx";

const EMPTY_FILTERS: FiltersValue = {search: '', status: null, level: null, type: null};

const ReadManger: React.FC = () => {

    const [form, setForm]               = useState<ReadForm>(EMPTY_FORM);
    const [tests, setTests]             = useState<ReadListItem[]>([]);
    const [loading, setLoading]         = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [filters, setFilters]         = useState<FiltersValue>(EMPTY_FILTERS);
    const [modalOpen, setModalOpen]     = useState(false);
    const [busyId, setBusyId]           = useState<string | null>(null);
    const [editingId, setEditingId]     = useState<string | null>(null);

    const {toast, show: showToast} = useToast();

    const closeModal = () => {
        if (modalLoading) return;
        setModalOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
    };

    const openCreate = () => {
        resetForm();
        setModalOpen(true);
    };

    const openEdit = (item: ReadListItem) => {
        if (!item._id) return;
        setEditingId(item._id);
        setForm(EMPTY_FORM); // modal's fetch effect will overwrite once it resolves
        setModalOpen(true);
    };

    const buildFormData = (form: ReadForm): FormData => {
        const fd = new FormData();

        fd.append("title", form.title.trim());
        fd.append("body", form.body.trim());
        fd.append("description", form.description.trim());
        fd.append("status", form.status as Status);

        if (form.metadata) fd.append("metadata", JSON.stringify(form.metadata));
        if (form.settings) fd.append("settings", JSON.stringify(form.settings));
        if (form.access)   fd.append("access", JSON.stringify(form.access));
        if (form.visibility) fd.append("visibility", form.visibility);
        if (form.stats)   fd.append("stats", JSON.stringify(form.stats));

        if (form.sections) fd.append("sections", JSON.stringify(form.sections));

        return fd;
    };

    const handleSave = async () => {

        if (form.title.trim().length < LIMITS.TITLE_MIN) {
            showToast(`Title must be at least ${LIMITS.TITLE_MIN} characters.`, "WARNING");
            return;
        }
        if (form.body.length < LIMITS.BODY_MIN) {
            showToast(`Reading passage is too short (${form.body.length}/${LIMITS.BODY_MIN} chars).`, "WARNING");
            return;
        }
        if (form.sections.length < 1 || form.sections.length > LIMITS.SECTIONS_MAX) {
            showToast(`Test must have 1–${LIMITS.SECTIONS_MAX} sections.`, "WARNING");
            return;
        }

        setModalLoading(true);
        try {
            const payload = buildFormData(form);
            if (editingId) {
                const res = await adminService.updateReadTask(editingId, payload);
                if (res.success) {
                    showToast("Test updated successfully!", "SUCCESS");
                    await loadTests();
                    closeModal();
                } else {
                    showToast(res.message ?? res.error ?? "Failed to update test", "WARNING");
                }
            } else {
                const res = await adminService.addReadTask(payload);
                if (res.success) {
                    showToast( res.message , "SUCCESS");
                    await loadTests();
                    closeModal();
                } else {
                    showToast(res.message ?? res.error ?? "Failed to create test", "WARNING");
                }
            }
        } catch (err: unknown) {
            showToast(apiMessage(err, "Server error"), "ERROR");
        } finally {
            setModalLoading(false);
        }
    };

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...(filters.status && filters.status !== null && { status: filters.status }),
                ...(filters.level  && { level: filters.level }),
                ...(filters.type   && { type: filters.type }),
            };
            const res = await adminService.getReadTest(params);
            setTests(res.data);
        } catch (err) {
            showToast("Failed to load reading tests", "ERROR");
            throw new AppError(`Failed to load reading tests :: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [showToast, filters]);

    useEffect(() => { loadTests(); }, [loadTests]);

    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this test? This action archives it and cannot be undone.")) return;
        setBusyId(id);
    try {
            await adminService.deleteReadTask(id);
            setTests(prev => prev.filter(t => t._id !== id));
            showToast("Test Deleted successfully", "SUCCESS");
        } catch {
            showToast("Delete failed", "ERROR");
        }finally{setBusyId(null);}
    };

    const handlePublish = async (item: ReadListItem) => {
        setBusyId(item._id as string);
        if (!item._id) return;
        const next: Status = item.status === "published" ? "draft" : "published";
        try {
            const fd = new FormData();
            fd.append('status', next);
            await adminService.updateReadTask(item._id, fd);
            setTests(prev =>
                prev.map(t => t._id === item._id ? { ...t, status: next } : t)
            );
            showToast(`Test ${next === "published" ? "published" : "moved to draft"}`, "SUCCESS");
        } catch {
            showToast("Status update failed", "ERROR");
        }finally{setBusyId(null);}
    };

    const handleArchive = async (item: ReadListItem) => {
        setBusyId(item._id as string);
        if (!item._id) return;
        const next: Status = item.status === "archived" ? "draft" : "archived";
        try {
            const fd = new FormData();
            fd.append('status', next);
            const updated = await adminService.updateReadTask(item._id as string, fd);
            setTests((prev) => prev.map((c) => (c._id === item._id ? updated : c)));
            showToast('Update Archive Success .', "SUCCESS");
        } catch (err) {
            showToast((err as Error).message, "ERROR"); // dropped stray alert()
        } finally {
            setBusyId(null);
        }
    };

    const filteredTests = tests.filter(t =>
        t.title?.toLowerCase().includes((filters.search ?? "").toLowerCase())
    );

    const hasFilters = Boolean(filters.status || filters.level || filters.type || filters.search);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <ToastBanner toast={toast} />
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                            <BookOpen size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Reading Tests</h1>
                            <p className="text-slate-500 text-sm">Manage reading passages and question sections</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">



                        {/* Refresh */}
                        <button
                            onClick={loadTests}
                            disabled={loading}
                            className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 transition-colors disabled:opacity-40"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>

                        {/* New test */}
                        <Button
                            label={'New Test'}
                            icon={<Plus size={16} /> }
                            onClick={openCreate}
                        />
                    </div>
                </div>
                {/** filter */}
                <>
                    <Filters
                        value={filters}
                        onChange={setFilters}
                        showSearch
                        showStatus
                        showLevel
                        showType
                        searchPlaceholder="Search tests by title…"
                    />
                </>

                {/* ── List ── */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <Loader2 size={32} className="text-emerald-500 animate-spin" />
                        <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                            Fetching tests…
                        </span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-slate-400 text-sm font-medium">Showing {filteredTests.length} Reading Tests</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredTests.map(test => (
                                <ReadItem
                                    key={test._id}
                                    read={test}
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

                {/* ── Empty state ── */}
                {!loading && filteredTests.length === 0 && (
                    <div className="text-center py-24 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl">
                        <BookOpen size={44} className="mx-auto text-slate-800 mb-4" />
                        <h2 className="text-slate-400 font-semibold">No tests found</h2>
                        <p className="text-slate-600 text-sm mt-1">
                            {hasFilters ? "Try adjusting your search or filters" : "Start by creating a new reading test"}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <ReadModal
                    form={form}
                    setForm={setForm}
                    onSave={handleSave}
                    onClose={closeModal}
                    editingId={editingId}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};

export default ReadManger;