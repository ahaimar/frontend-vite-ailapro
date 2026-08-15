import {useState, useEffect, useCallback} from "react";
import type React from "react";
import {LayoutGrid, Plus, RefreshCw, Loader2, AlertCircle, Volume2} from "lucide-react";

import type {PartForm, SpeakForm, SpeakTest } from "./speak.ts";
import {adminService} from "../../context/authService";
import {Button } from "../../ui/UI";
import {useToast} from "../../ui";
import SpeakModal from "./SpeakModel.tsx";
import {ToastBanner} from "../../ui/Toest.tsx";
import { SpeakItem } from "./SpeakItem.tsx";
import { apiMessage, type Status, } from "../index.ts";
import Filters, { type FiltersValue } from "../Filters.tsx";

const LIMIT = 9;

const EMPTY_FORM: SpeakForm = {
    title: "",
    description: "",
    status: "draft",
    metadata:       null,
    settings:       null,
    visibility:     null,
    access:         null,
    stats:          null,
    parts: [
        {speakType: "interview", textBody: "", explanation: "", audioFile: null},
    ],
};


function buildFormData(form: SpeakForm ): FormData {
    const fd = new FormData();

    fd.append("title", form.title.trim());
    fd.append("description", form.description.trim());
    fd.append("status", form.status);

    if (form.metadata) fd.append("metadata", JSON.stringify(form.metadata));
    if (form.settings) fd.append("settings", JSON.stringify(form.settings));
    if (form.access)   fd.append("access", JSON.stringify(form.access));
    if (form.stats)    fd.append("stats", JSON.stringify(form.stats));
    if (form.visibility != null) fd.append("visibility", form.visibility);

    const safeParts = Array.isArray(form.parts) ? form.parts : [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const partsJson: Omit<PartForm, "audioFile">[] = safeParts.map(({ audioFile: _drop, ...rest }) => rest);

    fd.append("parts", JSON.stringify(partsJson));

    safeParts.forEach((part, i) => {
        if (part.audioFile) {
            fd.append(`audio_${i}`, part.audioFile);
        }
    });

    return fd;
}

const EMPTY_FILTERS: FiltersValue = {search: '', status: null, level: null, type: null};

export const SpeakManger: React.FC = () => {

    const [speaks, setSpeaks] = useState<SpeakTest[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState<FiltersValue>(EMPTY_FILTERS);

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<SpeakForm>(EMPTY_FORM);

    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);

    const {toast, show: showToast} = useToast();

    const loadSpeak = useCallback(async () => {
        setListLoading(true);
        setListError(null);
        try {
            const params = {
                page,
                limit: LIMIT,
                ...(filters?.status  && {status: filters?.status as Status}),
                ...(filters?.level   && {difficulty: filters?.level}),
                ...(filters?.type    && {type: filters?.type}),
            };
            const res = await adminService.getSpeakTask(params);
            setSpeaks(res.data);
            setTotalPages(res.totalPages);
        } catch (err) {
            setListError((err as Error).message);
            showToast("Failed to load speaks: " + (err as Error).message, "ERROR");
        } finally {
            setListLoading(false);
        }
    }, [page, filters, showToast]);

    useEffect(() => {
        loadSpeak();
    }, [loadSpeak]);

    const openCreate = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setModalOpen(true);
    };

    const openEdit = (speak: SpeakTest) => {
        setEditingId(speak._id);
        setForm(EMPTY_FORM); // modal's fetch effect will overwrite this once it resolves
        setModalOpen(true);
    };

    const closeModal = () => {
        if (modalLoading) return;
        setModalOpen(false);
        setEditingId(null);
    };

    const handleSave = async () => {
        if (!form.title.trim()) {
            showToast("Title is required.", "WARNING");
            return;
        }
        if (!form.parts[0]?.textBody?.trim()) {
            showToast("At least one part with prompt text is required.", "WARNING");
            return;
        }

        setModalLoading(true);
        try {
            const payload = buildFormData(form) as FormData;

            if (editingId) {
                const updated = await adminService.updateSpeak(editingId, payload);
                if(updated.success === true){
                    setSpeaks(prev => prev.map(c => c._id === updated._id ? updated : c));
                    showToast("Speak updated successfully.", "SUCCESS");
                }else{
                   showToast("Field to updated !!", "INFO"); 
                }
                
            } else {
                const created = await adminService.createSpeakTest(payload);
                if(created?.success === true){
                    setSpeaks(prev => [created, ...prev]);
                    showToast("Speak created successfully.", "SUCCESS");
                }else{

                   showToast("Field to created !!", "INFO"); 
                }
                
            }
            closeModal();
        } catch (err) {
            console.log(err);
            showToast(apiMessage((err as Error).message, "Failed to save speak: " ), "ERROR");
        } finally {
            setModalLoading(false);
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Delete this test? This action archives it and cannot be undone.")) return;
        setBusyId(id);
        try {
            await adminService.deleteSpeak(id);
            setSpeaks(prev => prev.filter(t => t._id !== id));
            showToast("Test Deleted successfully", "SUCCESS");
        } catch {
            showToast("Delete failed", "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const handlePublish = async (id: string) => {
        const item = speaks.find(s => s._id === id);
        if (!item) return;
        setBusyId(id);
        const next: Status = item.status === "published" ? "draft" : "published";
        try {
            const payload = new FormData();
            payload.append("status", next);
            await adminService.updateSpeak(id, payload);
            setSpeaks(prev => prev.map(t => t._id === id ? { ...t, status: next } : t));
            showToast(`Test ${next === "published" ? "published" : "moved to draft"}`, "SUCCESS");
        } catch {
            showToast("Status update failed", "ERROR");
        } finally { setBusyId(null); }
    };

    const handleArchive = async (id: string) => {
        const item = speaks.find(s => s._id === id);
        if (!item) return;
        setBusyId(id);
        const next: Status = item.status === "archived" ? "draft" : "archived";
        try {
            const payload = new FormData();
            payload.append("status", next);
            const updated = await adminService.updateSpeak(id, payload);
            setSpeaks((prev) => prev.map((c) => (c._id === id ? updated : c)));
            showToast(next === "archived" ? "Test archived." : "Test restored to draft.", "SUCCESS");
        } catch (err) {
            showToast((err as Error).message, "ERROR");
        } finally {
            setBusyId(null);
        }
    };
    
    const hasFilters = Boolean(filters.status || filters.level || filters.type || filters.search);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <ToastBanner toast={toast}/>
            <div className="max-w-7xl mx-auto space-y-6">
                

                <div className="flex items-start justify-between mb-10 flex-wrap gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30
                                            flex items-center justify-center">
                                <Volume2 size={17} className="text-rose-400"/>
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-slate-100">Test Speak</h1>
                        </div>
                        <p className="text-sm text-slate-500 ml-12">
                            Manage and publish bundled IELTS speaking tests
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={loadSpeak}
                            disabled={listLoading}
                            title="Refresh"
                            className="p-2.5 rounded-xl border border-slate-800 hover:bg-slate-900
                                       text-slate-400 transition-colors disabled:opacity-40"
                        >
                            <RefreshCw size={16} className={listLoading ? "animate-spin" : ""}/>
                        </button>
                        <Button label="New Speak" icon={<Plus size={13}/>} onClick={openCreate}/>
                    </div>
                </div>

                {/* ── Filters ── */}
                <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-05 mb-6 shadow-lg">
                    <Filters
                        value={filters as FiltersValue}
                        onChange={(next) => { setFilters(next); setPage(1); }}
                        showStatus
                        showLevel
                        showType
                    />
                </div>


                {/* ── Error banner ── */}
                {listError && (
                    <div className="flex items-center gap-3 bg-rose-950/60 border border-rose-700/50
                                    text-rose-300 text-sm px-5 py-3.5 rounded-2xl mb-6">
                        <AlertCircle size={16}/>
                        {listError}
                        <button
                            onClick={loadSpeak}
                            className="ml-auto underline text-rose-400 hover:text-rose-200 text-xs"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* ── Speak grid ── */}
                {listLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3">
                        <Loader2 size={28} className="text-indigo-400 animate-spin"/>
                        <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                            Loading speaks…
                        </span>
                    </div>
                ) : speaks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-600">
                        <LayoutGrid size={40} strokeWidth={1}/>
                        <div className="text-center">
                            <p className="text-sm font-semibold text-slate-500">No speaks found</p>
                            <p className="text-xs mt-1">
                                {hasFilters
                                    ? "Try adjusting your filters"
                                    : "Create your first speak to get started"}
                            </p>
                        </div>
                        {!hasFilters && (
                            <Button
                                label="New Speak"
                                icon={<Plus size={13}/>}
                                onClick={openCreate}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                                           uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white
                                           border border-indigo-500/50 transition-all mt-2"
                            />
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {speaks.map(speak => (
                                <SpeakItem
                                    key={speak._id}
                                    speak={speak}
                                    onEdit={openEdit}
                                    onDelete={handleDelete}
                                    onPublish={handlePublish}
                                    onArchive={handleArchive}
                                    busy={busyId === speak._id}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-4">
                                <Button
                                    disabled={page <= 1 || listLoading}
                                    onClick={() => setPage(p => p - 1)}
                                    variant="outline"
                                    label="← Prev"
                                />
                                <span className="text-xs text-slate-500 font-semibold tracking-widest">
                                    {page} / {totalPages}
                                </span>
                                <Button
                                    disabled={page >= totalPages || listLoading}
                                    onClick={() => setPage(p => p + 1)}
                                    label="Next →"
                                    variant="outline"
                                />                                
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <SpeakModal
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