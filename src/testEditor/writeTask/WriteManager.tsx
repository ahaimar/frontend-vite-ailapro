import React, { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Loader2, NotepadText } from "lucide-react";
import { adminService } from "../../context/authService";
import { useToast } from "../../ui";
import { WriteModal } from "./WriteModal.tsx";
import { ToastBanner } from "../../ui/Toest.tsx";
import { WriteItem } from "./WriteItem.tsx";
import {
    EMPTY_FORM,
    LIMITS,
    type WriteForm,
    type WriteListItem,
    type WriteTest,
} from "./writeDTO.ts";
import { Button } from "../../ui/UI.tsx";
import { apiMessage } from "../index.ts";
import { Filters, type FiltersValue } from "../Filters.tsx";

const toWriteForm = (doc: WriteTest): WriteForm => ({
  title: doc.title ?? "",
  description: doc.description ?? "",
  status: doc.status ?? "draft",
  visibility: doc.visibility ?? null,
  overallBand: doc.overallBand ?? null,
  completedAt: doc.completedAt ?? null,
  tasks: doc.tasks ?? [],
  metadata: {
    estimatedDuration: doc.metadata?.estimatedDuration ?? 60,
    topic: doc.metadata?.topic ?? "",
    tags: doc.metadata?.tags ?? [],
    source: doc.metadata?.source ?? "", // Fixed here
    level: doc.metadata?.level ?? null,
    type: doc.metadata?.type ?? null,
    version: doc.metadata?.version ?? 0,
  },
  settings: {
    showAnswersAfterSubmit: doc.settings?.showAnswersAfterSubmit ?? true,
    shuffleQuestions: doc.settings?.shuffleQuestions ?? false,
    shuffleOptions: doc.settings?.shuffleOptions ?? false,
    allowReview: doc.settings?.allowReview ?? true,
    timeLimitSec: doc.settings?.timeLimitSec ?? 0,
    maxAttempts: doc.settings?.maxAttempts ?? 0,
    passingScore: doc.settings?.passingScore ?? 0,
    passingBand: doc.settings?.passingBand ?? 0,
  },
  access: {
    isFree: doc.access?.isFree ?? false,
    price: doc.access?.price ?? 0,
    tier: doc.access?.tier ?? null,
  },
  stats: {
    totalQuestions: doc.stats?.totalQuestions ?? 0,
    totalMarks: doc.stats?.totalMarks ?? 0,
  },
});

const EMPTY_FILTERS: FiltersValue = {search: '', status: null, level: null, type: null};


export const WriteManager: React.FC = () => {
    
    const [form,         setForm        ] = useState<WriteForm>(EMPTY_FORM);
    const [editingId,    setEditingId   ] = useState<string | null>(null);
    const [taskFiles, setTaskFiles] = useState<(File | null)[]>([null]);
    const [filters, setFilters] = useState<FiltersValue>(EMPTY_FILTERS);
    const [tests,        setTests       ] = useState<WriteListItem[]>([]);
    const [loading,      setLoading     ] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalOpen,    setModalOpen   ] = useState(false);
    const [busyId,       setBusyId      ] = useState<string | null>(null);

    const { toast, show: showToast } = useToast();

    // ── Modal helpers ─────────────────────────────────────────────────────────

    const closeModal = useCallback(() => {
        if (modalLoading) return;
        setModalOpen(false);
        setForm(EMPTY_FORM);
        setTaskFiles([null]);
        setEditingId(null);
    }, [modalLoading]);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setTaskFiles([null]);
        setEditingId(null);
        setModalOpen(true);
    };

    const openEdit = async (item: WriteListItem) => {
        if (!item._id) return;
        setLoading(true);
        try {
            const res            = await adminService.getWriteTaskById(item._id);
            const full: WriteTest = res.data;
            const nextForm       = toWriteForm(full);
            setForm(nextForm);
            setTaskFiles(nextForm.tasks.map(() => null)); // no new files yet — existing diagram_url shown as preview
            setEditingId(full._id);
            setModalOpen(true);
        } catch {
            showToast("Failed to load writing test details", "ERROR");
        } finally {
            setLoading(false);
        }
    };

    // ── Load tests ────────────────────────────────────────────────────────────

    const loadTests = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                ...(filters.status && filters.status !== null && { status: filters.status }),
                ...(filters.level  && { level: filters.level }),
                ...(filters.type   && { type: filters.type }),
            };
            const res = await adminService.getWriteTask(params);
            setTests(res.data ?? []);
        } catch {
            showToast("Failed to load writing tests", "ERROR");
        } finally {
            setLoading(false);
        }
    }, [filters, showToast]);

    useEffect(() => { loadTests(); }, [loadTests]);
    

    // ── Task file helpers — keep taskFiles array in sync with form.tasks ──────

    const setTaskFile = useCallback((index: number, file: File | null) => {
        setTaskFiles(prev => {
            const next = [...prev];
            next[index] = file;
            return next;
        });
    }, []);

    const addTaskFileSlot = useCallback(() => {
        setTaskFiles(prev => [...prev, null]);
    }, []);

    const removeTaskFileSlot = useCallback((index: number) => {
        setTaskFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

// ─── Validation ─────────────────────────────────────────────────────────────

    const validateForm = (form: WriteForm): string | null => {
        if (!form.title.trim() || form.title.trim().length < LIMITS.TITLE_MIN) {
            return `Title must be at least ${LIMITS.TITLE_MIN} characters.`;
        }
        if (form.description.length > LIMITS.DESC_MAX) {
            return `Description must be under ${LIMITS.DESC_MAX} characters.`;
        }
        if (form.tasks.length === 0 || form.tasks.length > LIMITS.TASKS_MAX) {
            return `Tasks must contain between 1 and ${LIMITS.TASKS_MAX} entries.`;
        }
        for (let i = 0; i < form.tasks.length; i++) {
            const t = form.tasks[i];
            if (!t.taskType) return `Task ${i + 1}: task type is required.`;
            if (!t.question.trim()) return `Task ${i + 1}: question prompt is required.`;
        }
        return null;
    };

    // ─── FormData builder ─────────────────────────────────────────────────────────

    const buildFormData = (form: WriteForm, taskFiles: (File | null)[]): FormData => {
        const fd = new FormData();

        fd.append("title", form.title.trim());
        fd.append("description", form.description.trim());
        fd.append("status", form.status);

        if (form.metadata) fd.append("metadata", JSON.stringify(form.metadata));
        if (form.settings) fd.append("settings", JSON.stringify(form.settings));
        if (form.access)   fd.append("access", JSON.stringify(form.access));
        if (form.visibility) fd.append("visibility", form.visibility);

        const tasksPayload = form.tasks.map((task) => {
            const taskPayload = { ...task };
            delete taskPayload.diagram_url;
            delete taskPayload.diagram_public_id;
            return taskPayload;
        });
        fd.append("tasks", JSON.stringify(tasksPayload));

        taskFiles.forEach((file, i) => {
            if (file) fd.append(`diagram_${i}`, file);
        });

        return fd;
    };

    const handleSave = async () => {
        const error = validateForm(form);
        if (error) {
            showToast(error, "WARNING");
            return;
        }

        setModalLoading(true);
        try {
            const fd = buildFormData(form, taskFiles);

            if (editingId) {
                const res = await adminService.updateWriteTask(editingId, fd);
                if (res.success) {
                    setTests(prev =>
                        prev.map(t => t._id === editingId ? { ...t, ...res.data } : t),
                    );
                    if (res.success) {
                        showToast("Writing test updated successfully!", "SUCCESS");
                        console.log(res.message);
                        closeModal();
                    } else {
                        showToast("Failed to update writing test", "WARNING");
                        console.log(res.error ?? res.message);
                    }
                } else {
                    showToast(res.message ?? "Failed to update writing test", "WARNING");
                }
            } else {
                const res = await adminService.addWriteTask(fd);
                if (res.success) {
                    showToast("Writing test created successfully!", "SUCCESS");
                    await loadTests();
                    closeModal();
                } else {
                    showToast(res.message ?? "Failed to create writing test", "WARNING");
                }
            }
        } catch (err) {
            showToast("An error occurred while saving the test", "ERROR");
            console.log(apiMessage(err, "An error occurred while saving the test"));
        } finally {
            setModalLoading(false);
        }
    };

    const handlePublish = async (id: string) => {
        const item = tests.find(t => t._id === id);
        if (!item || item.status !== "draft") return;

        setBusyId(id);
        try {
            await adminService.updateWriteTask(id, { status: "published" } as Partial<WriteForm>);
            setTests(prev => prev.map(t => t._id === id ? { ...t, status: "published" } : t));
            showToast("Test published successfully.", "SUCCESS");
        } catch {
            showToast("Failed to publish test.", "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const handleArchive = async (id: string) => {
        const item = tests.find(t => t._id === id);
        if (!item || item.status !== "published") return;

        setBusyId(id);
        try {
            await adminService.updateWriteTask(id, { status: "archived" } as Partial<WriteForm>);
            setTests(prev => prev.map(t => t._id === id ? { ...t, status: "archived" } : t));
            showToast("Test archived successfully.", "SUCCESS");
        } catch {
            showToast("Failed to archive test.", "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this writing test?")) return;
        setBusyId(id);
        try {
            await adminService.deleteWriteTask(id);
            setTests(prev => prev.filter(t => t._id !== id));
            showToast("Test deleted successfully.", "SUCCESS");
        } catch {
            showToast("Failed to delete test.", "ERROR");
        } finally {
            setBusyId(null);
        }
    };

    const filteredTests = tests.filter(t =>
        (t.title ?? "").toLowerCase().includes((filters.search ?? "").toLowerCase()),
    );

    const hasFilters = Boolean(filters.status || filters.level || filters.type || filters.search);


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
            <ToastBanner toast={toast} />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30
                                        flex items-center justify-center shrink-0">
                            <NotepadText size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-100 tracking-tight">
                                Writing Tests
                            </h1>
                            <p className="text-xs text-slate-400">
                                Manage IELTS writing mock examinations and tasks
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={loadTests}
                            disabled={loading}
                            title="Refresh"
                            variant="outline"
                            icon={<RefreshCw size={14} className={loading ? "animate-spin" : ""} />}
                        />
                        
                        <Button
                            label={'New Test'}
                            icon={<Plus size={14} /> }
                            onClick={openCreate}
                        />
                    </div>
                </div>
                
                {/* ── Filters ── */}
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
                {loading && tests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={24} className="text-indigo-500 animate-spin" />
                        <span className="text-xs text-slate-400 font-medium">
                            Loading test repository…
                        </span>
                    </div>
                ) : filteredTests.length === 0 ? (
                    <div className="border border-dashed border-slate-800 rounded-2xl py-16 text-center">
                        <p className="text-sm text-slate-500">
                            {hasFilters ? "No writing tests match the current filters." : "No writing tests yet."}
                        </p>
                        <Button
                            onClick={openCreate}
                            label="Create the first one"

                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredTests.map(test => (
                            <WriteItem
                                key={test._id}
                                write={test as WriteTest}   // WriteListItem ⊂ WriteTest fields
                                onEdit={openEdit}
                                onDelete={handleDelete}
                                onPublish={handlePublish}
                                onArchive={handleArchive}
                                busy={busyId === test._id}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modalOpen && (
                <WriteModal
                    form={form}
                    setForm={setForm}
                    taskFiles={taskFiles}
                    onTaskFileChange={setTaskFile}
                    onAddTaskFileSlot={addTaskFileSlot}
                    onRemoveTaskFileSlot={removeTaskFileSlot}
                    onSave={handleSave}
                    onClose={closeModal}
                    isEditing={!!editingId}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};
