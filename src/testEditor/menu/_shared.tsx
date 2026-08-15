// ─── Shared types & UI primitives for Write/Read/Listen/Speak models ──────────

import { Button } from "../../ui/UI";

export type TestStatus = "draft" | "published" | "archived" | "completed";

export interface BaseTestListItem {
    _id:             string;
    title:           string;
    description:     string;
    status:          TestStatus;
    overallBand?:    number | null;
    completedAt?:    string | null;
    createdAt:       string;
    totalQuestions?: number;
}

export const DIFFICULTY_COLORS: Record<string, string> = {
    EASY:   "badge-success",
    MEDIUM: "badge-warning",
    HARD:   "badge-error",
};

export function ModelSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-slate-800 bg-[#0d1525] p-4 gap-3 flex flex-col animate-pulse">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-slate-800 rounded w-3/4" />
                            <div className="h-2 bg-slate-800 rounded w-1/2" />
                        </div>
                    </div>
                    <div className="h-2 bg-slate-800 rounded w-full" />
                    <div className="h-2 bg-slate-800 rounded w-5/6" />
                    <div className="h-8 bg-slate-800 rounded-lg mt-auto" />
                </div>
            ))}
        </div>
    );
}

export function ModelEmpty({ icon, label }: { icon: string; label: string }) {
    return (
        <div className="py-16 text-center text-slate-500">
            <p className="text-4xl mb-3">{icon}</p>
            <p className="font-semibold">{label}</p>
        </div>
    );
}

export function ModelError({ label, onRetry }: { label: string; onRetry: () => void }) {
    return (
        <div className="py-16 text-center text-slate-500 flex flex-col items-center gap-3">
            <p className="text-4xl">⚠️</p>
            <p className="font-semibold">{label}</p>
            <Button 
                onClick={onRetry} 
                label='Refresh'
                variant="ghost"
            />
        </div>
    );
}