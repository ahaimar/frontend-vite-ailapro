import type React from "react";
import {
    Pencil,
    Trash2,
    Archive,
    Send,
    BookOpen,
    Headphones,
    Mic,
    PenLine,
    BadgeDollarSign,
    Gift,
    Loader2,
} from "lucide-react";
import type {Difficulty, IELTSCard, SkillKey} from "./carde";
import { DIFFICULTY_CLASSES } from "..";

const SKILL_KEYS: SkillKey[] = ["writing", "reading", "listening", "speaking"];

const SKILL_META: Record<SkillKey, { label: string; Icon: React.FC<{ size?: number; className?: string }> }> = {
    writing: {label: "Writing", Icon: PenLine},
    reading: {label: "Reading", Icon: BookOpen},
    listening: {label: "Listening", Icon: Headphones},
    speaking: {label: "Speaking", Icon: Mic},
};

const TEST_TYPE_LABELS: Record<string, string> = {
    mock_test: "Mock test",
    practice_test: "Practice test",
    mini_test: "Mini test",
};

const STATUS_CLASSES: Record<string, string> = {
    published: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
    draft: "bg-slate-800 border-slate-600 text-slate-400",
    archived: "bg-slate-800/60 border-slate-700 text-slate-500",
};

// ─── Helper: Get linked test title for a skill
const getLinkedTestTitle = (card: IELTSCard, skillKey: SkillKey): string | null => {
    const titleMap: Record<SkillKey, string | undefined> = {
        writing: card.writeTest?.title,
        reading: card.readTest?.title,
        listening: card.listenTest?.title,
        speaking: card.speakTest?.title,
    };
    return titleMap[skillKey] ?? null;
};

interface CardItemProps {
    card: IELTSCard;
    onEdit: (card: IELTSCard) => void;
    onDelete: (id: string) => Promise<void>;
    onPublish: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    busy: boolean;
}

const CardItem: React.FC<CardItemProps> = ({card, onEdit, onDelete, onPublish, onArchive, busy,}) => {
    // ✅ Fixed: corrected optional chaining syntax (was `?. [s]`)
    const linkedCount = SKILL_KEYS.filter((s) => card.skills?.[s] != null).length;
    const difficulty = card?.metadata?.difficulty as Difficulty;

    return (
        <div className="group bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden
                shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-900/20 transition-all duration-200">
            <div
                className={`h-0.5 ${card.status === "published"
                    ? "bg-linear-to-r from-emerald-500 to-teal-400"
                    : card.status === "draft"
                        ? "bg-linear-to-r from-indigo-500 to-violet-500"
                        : "bg-slate-700"
                }`}
            />

            <div className="p-5 flex flex-col gap-3">

                <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold text-slate-100 leading-snug flex-1 line-clamp-2">
                        {card.title || 'Untitled'}
                    </h3>
                    <span
                        className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${STATUS_CLASSES[card.status]}`}>
                        {card.status || 'unknown'}
                    </span>
                </div>

                {/* Description */}
                {card.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {card.description}
                    </p>
                )}

                {/* Skills pills */}
                <div className="flex flex-wrap gap-1.5">
                    {SKILL_KEYS.map((sk) => {
                        const {label, Icon} = SKILL_META[sk];
                        const active = card.skills?.[sk] != null;
                        // ✅ Fixed: handle null tooltip value properly
                        const linkedTestTitle = getLinkedTestTitle(card, sk);
                        const tooltipText = linkedTestTitle || `No ${label} test linked`;

                        return (
                            <span
                                key={sk}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border transition-colors tooltip tooltip-top
                                    ${active
                                    ? "bg-indigo-900/40 border-indigo-500/40 text-indigo-300"
                                    : "bg-slate-800/40 border-slate-700 text-slate-600"
                                }`}
                                data-tip={tooltipText}
                            >
                                <Icon size={9}/>
                                {label}
                            </span>
                        );
                    })}
                </div>

                {/* Meta badges */}
                <div className="flex flex-wrap gap-1.5">
                    <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-widest ${DIFFICULTY_CLASSES[difficulty]}`}>
                        {card.metadata?.difficulty || 'Unknown'}
                    </span>
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        {TEST_TYPE_LABELS[card.testType]}
                    </span>
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        {card.accessType === "paid"
                            ? <><BadgeDollarSign size={9}/> Paid</>
                            : <><Gift size={9}/> Free</>
                        }
                    </span>
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800/60 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                        {card.type}
                    </span>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700/60"/>

                {/* Footer actions */}
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600 font-medium uppercase tracking-widest">
                        {linkedCount} skill{linkedCount !== 1 ? "s" : ""} linked
                    </span>

                    <div className="flex items-center gap-1">
                        {busy ? (
                            <Loader2 size={14} className="text-slate-500 animate-spin mr-1"/>
                        ) : (
                            <>
                                {card.status === "draft" && (
                                    <button
                                        onClick={() => onPublish(card._id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest
                                        bg-emerald-900/40 border border-emerald-700/50 text-emerald-300
                                        hover:bg-emerald-800/50 transition-all"
                                    >
                                        <Send size={10}/> Publish
                                    </button>
                                )}
                                {card.status === "published" && (
                                    <button
                                        onClick={() => onArchive(card._id)}
                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest
                                        bg-slate-800 border border-slate-700 text-slate-400
                                        hover:bg-slate-700 transition-all"
                                    >
                                        <Archive size={10}/> Archive
                                    </button>
                                )}
                                <button
                                    onClick={() => onEdit(card)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest
                                        bg-indigo-900/30 border border-indigo-700/40 text-indigo-400
                                        hover:bg-indigo-900/50 transition-all"
                                >
                                    <Pencil size={10}/> Edit
                                </button>
                                <button
                                    onClick={() => onDelete(card._id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest
                                    bg-rose-950/40 border border-rose-800/40 text-rose-400
                                    hover:bg-rose-900/40 transition-all"
                                >
                                    <Trash2 size={10}/>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardItem;