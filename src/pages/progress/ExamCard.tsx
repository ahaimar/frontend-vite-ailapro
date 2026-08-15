import type React from "react";
import { useMemo, useState } from "react";
import {
    PenLine, BookOpen, Headphones, Mic,
    Lock, Clock, X,
} from "lucide-react";
import type { Difficulty, IELTSCard, SkillKey } from "../../testEditor/card/carde.ts";
import ICON from "../../assets/menu icon-14.png";
import { Button } from "../../ui/UI.tsx";
import { TestCorrectionView } from "./TestCorrectionView.tsx";

const SKILL_KEYS: SkillKey[] = ["writing", "reading", "listening", "speaking"];

const SKILL_ICON: Record<SkillKey, React.ReactNode> = {
    writing:   <PenLine size={11} />,
    reading:   <BookOpen size={11} />,
    listening: <Headphones size={11} />,
    speaking:  <Mic size={11} />,
};

const SKILL_LABEL: Record<SkillKey, string> = {
    writing:   "Writing",
    reading:   "Reading",
    listening: "Listening",
    speaking:  "Speaking",
};

const DIFF_BADGE: Record<string, string> = {
    Easy:   "bg-emerald-900/50 border-emerald-700 text-emerald-300",
    Medium: "bg-amber-900/50 border-amber-700 text-amber-300",
    Hard:   "bg-rose-900/60 border-rose-700 text-rose-300",
    Mixed:  "bg-cyan-900/50 border-cyan-700 text-cyan-300",
};

const TYPE_BADGE: Record<string, string> = {
    mock_test:     "Mock Test",
    practice_test: "Practice Test",
    mini_test:     "Mini Test",
};

// Pure function — doesn't depend on props/state, so it's defined once at
// module scope instead of being recreated on every ExamCard render.
function getIeltsSkillLevel(score: number): string {
    if (typeof score !== "number" || Number.isNaN(score) || score < 0.0 || score > 9.0) {
        return "Invalid Score";
    }

    // Evaluate from highest to lowest score to stop at the first matching condition
    if (score === 9.0) return "Expert User";
    if (score >= 8.0) return "Very Good User";
    if (score >= 7.0) return "Good User";
    if (score >= 6.0) return "Competent User";
    if (score >= 5.0) return "Modest User";
    if (score >= 4.0) return "Limited User";
    if (score >= 3.0) return "Extremely Limited User";
    if (score >= 2.0) return "Intermittent User";
    if (score >= 1.0) return "Non-User";

    return "Did Not Attempt";
}

interface ExamCardProps {
    card: IELTSCard;
    durationMinutes: number;
    sections: number;
    parts: number;
    tasks: number;
    completedSkills: SkillKey[];
    onTakeExam: (cardId: string) => void;
}

// One slot per skill so each TestCorrectionView reports its own score
// independently, instead of four components fighting over one variable.
interface SkillScores {
    writing: number | null;
    reading: number | null;
    listening: number | null;
    speaking: number | null;
}

const EMPTY_SCORES: SkillScores = {
    writing: null,
    reading: null,
    listening: null,
    speaking: null,
};

export const ExamCard: React.FC<ExamCardProps> = ({
    card,
    durationMinutes,
    sections,
    parts,
    tasks,
    completedSkills,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const difficulty = (card.metadata?.difficulty as Difficulty) || "Mixed";

    const [scores, setScores] = useState<SkillScores>(EMPTY_SCORES);

    const overallScore = useMemo(() => {
        const sum =
            (scores.writing ?? 0) +
            (scores.reading ?? 0) +
            (scores.listening ?? 0) +
            (scores.speaking ?? 0);
        return Math.round((sum / 4) * 2) / 2;
    }, [scores]);

    const skillLevel = useMemo(() => getIeltsSkillLevel(overallScore), [overallScore]);

    const makeScoreHandler = (skill: keyof SkillScores) => (score: number | null) => {
        setScores((prev) => {
            if (prev[skill] === score) return prev; // avoid redundant state updates / re-renders
            return { ...prev, [skill]: score };
        });
    };


    return (
        <>
            <article
                role="article"
                aria-label={card.title}
                className="bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden
                           shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-900/20 transition-all duration-200"
            >
                <div className="p-5 flex flex-col gap-4">
                    {/* ── Header: Icon + Title + Metadata ── */}
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/10
                                        flex items-center justify-center shrink-0">
                            <img src={ICON} alt="IELTS" className="w-8 h-8" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-slate-100 leading-snug truncate">
                                {card.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                                <Clock size={10} />
                                <span>{durationMinutes} min</span>
                                <span className="text-slate-600">|</span>
                                <span>{sections} Sections</span>
                                <span className="text-slate-600">|</span>
                                <span>{parts} parts</span>
                                <span className="text-slate-600">|</span>
                                <span>{tasks} Tasks</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Description ── */}
                    {card.description && (
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-1">
                            {card.description}
                        </p>
                    )}

                    {/* ── Skill Pills ── */}
                    <div className="flex flex-wrap gap-2">
                        {SKILL_KEYS.map((skill) => {
                            const isCompleted = completedSkills.includes(skill);
                            return (
                                <span
                                    key={skill}
                                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                                text-[10px] font-semibold uppercase tracking-wide border transition-colors ${
                                        isCompleted
                                            ? "bg-indigo-900/40 border-indigo-700/50 text-indigo-300"
                                            : "bg-slate-800/50 border-slate-700 text-slate-600"
                                    }`}
                                >
                                    {SKILL_ICON[skill]}
                                    {SKILL_LABEL[skill]}
                                </span>
                            );
                        })}
                    </div>

                    {/* ── Attribute Badges ── */}
                    <div className="flex flex-wrap gap-2">
                        <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px]
                                font-bold uppercase tracking-widest border ${DIFF_BADGE[difficulty]}`}
                        >
                            {difficulty}
                        </span>

                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px]
                            font-semibold uppercase tracking-widest border bg-slate-800/60 border-slate-700 text-slate-400">
                            {TYPE_BADGE[card.testType] || card.testType}
                        </span>

                        <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px]
                                font-semibold uppercase tracking-widest border ${
                                card.accessType === "paid"
                                    ? "bg-slate-800/60 border-slate-700 text-slate-400"
                                    : "bg-emerald-900/40 border-emerald-700/50 text-emerald-300"
                            }`}
                        >
                            {card.accessType === "paid" && <Lock size={9} />}
                            {card.accessType}
                        </span>

                        {card.type && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px]
                                font-semibold uppercase tracking-widest border bg-slate-800/60 border-slate-700 text-slate-400">
                                {card.type}
                            </span>
                        )}
                    </div>

                    {/* ── Action Buttons ── */}
                    <div className="flex gap-2 mt-2">
                        {/*<Button
                            label="Take Exam"
                            variant="primary"
                            size="sm"
                            icon={<Play size={13} className="fill-current" />}
                            className="flex-1"
                            onClick={() => onTakeExam(card._id)}
                        />*/}
                        <Button
                            label="View Data"
                            variant="secondary"
                            size="sm"
                            icon={<Clock size={13} />}
                            className="flex-1"
                            onClick={() => setIsModalOpen(true)}
                        />
                    </div>
                </div>
            </article>

            {/* ── Modal ── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-slate-700/60">
                            <div>
                                <h3 className="text-lg font-bold text-slate-100">
                                    {card.title} - Exam Data
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Overall band:{" "}
                                <span className="font-semibold text-slate-200">
                                    {overallScore}
                                </span>
                                {" "}·{" "}
                                <span className={`font-semibold border rounded px-1.5 py-0.5 text-white ${
                                    overallScore >= 8.0 ? 'bg-green-600/90 border-green-500' : 
                                    overallScore <= 5.0 ? 'bg-red-600/90 border-red-500' : 
                                    'bg-orange-600/90 border-orange-500'
                                }`}>
                                    {skillLevel}
                                </span>
                            </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Close modal"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 flex flex-col gap-4">
                            {/* Duration & Structure */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duration</span>
                                    <p className="text-lg font-bold text-slate-100 mt-1">{durationMinutes} min</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sections</span>
                                    <p className="text-lg font-bold text-slate-100 mt-1">{sections}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Parts</span>
                                    <p className="text-lg font-bold text-slate-100 mt-1">{parts}</p>
                                </div>
                                <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tasks</span>
                                    <p className="text-lg font-bold text-slate-100 mt-1">{tasks}</p>
                                </div>
                            </div>

                            {/* Per-skill score summary */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                                    Scores
                                </span>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {SKILL_KEYS.map((skill) => (
                                        <div
                                            key={skill}
                                            className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3"
                                        >
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                                {SKILL_LABEL[skill]}
                                            </span>
                                            <p className="text-lg font-bold text-slate-100 mt-1">
                                                {scores[skill] ?? "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Completed Skills */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Completed Skills</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {SKILL_KEYS.map((skill) => (
                                        <span
                                            key={skill}
                                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
                                                        text-[10px] font-semibold uppercase tracking-wide border ${
                                                completedSkills.includes(skill)
                                                    ? "bg-emerald-900/40 border-emerald-700/50 text-emerald-300"
                                                    : "bg-slate-800/50 border-slate-700 text-slate-600"
                                            }`}
                                        >
                                            {SKILL_ICON[skill]}
                                            {SKILL_LABEL[skill]}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Card Metadata */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">Details</span>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Difficulty:</span>
                                        <span className="font-semibold text-slate-100">{card.metadata?.difficulty || "Unknown"}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Test Type:</span>
                                        <span className="font-semibold text-slate-100">{TYPE_BADGE[card.testType] || card.testType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Access:</span>
                                        <span className="font-semibold text-slate-100 capitalize">{card.accessType}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Type:</span>
                                        <span className="font-semibold text-slate-100">{card.type}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Test Corrections, per skill */}
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block mb-2">
                                    Corrections
                                </span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <TestCorrectionView
                                        label="Writing"
                                        testRef={card.writeTest?._id}
                                        onScoreChange={makeScoreHandler("writing")}
                                    />
                                    <TestCorrectionView
                                        label="Reading"
                                        testRef={card.readTest?._id}
                                        onScoreChange={makeScoreHandler("reading")}
                                    />
                                    <TestCorrectionView
                                        label="Listening"
                                        testRef={card.listenTest?._id ?? '6a5e62ea2517e1943af148b7'}
                                        onScoreChange={makeScoreHandler("listening")}
                                    />
                                    <TestCorrectionView
                                        label="Speaking"
                                        testRef={card.speakTest?._id}
                                        onScoreChange={makeScoreHandler("speaking")}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-700/60 p-5">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700
                                         text-slate-200 font-semibold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExamCard;