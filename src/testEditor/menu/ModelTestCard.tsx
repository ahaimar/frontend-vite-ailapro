import { useNavigate } from "react-router";
import { DIFFICULTY_COLORS, type BaseTestListItem } from "./_shared";
import { useAuthStore } from "../../context/authStore";
import { Button } from "../../ui/UI";
import { Lock, PlayCircle, Eye } from "lucide-react";

interface ModelTestCardProps {
    test:         BaseTestListItem;
    skillRoute:   string;          // e.g. "writing" | "reading" | "listening" | "speaking"
    icon:         string;          // imported image path
    accentClass:  string;          // e.g. "text-blue-400"
    minutes?:     number;
    difficulty?:  "EASY" | "MEDIUM" | "HARD";
}

export default function ModelTestCard({
    test,
    skillRoute,
    icon,
    accentClass,
    minutes = 60,
    difficulty = "MEDIUM",
}: ModelTestCardProps) {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const canStart = user?.is_subscription || user?.role === "admin";
    const isCompleted = test.status === "completed";

    return (
        <div className="rounded-2xl border border-slate-800 bg-[#0d1525] hover:border-blue-500/50 transition-colors duration-200 p-4 gap-3 flex flex-col justify-between h-full">
            <div className="flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center shrink-0">
                        <img src={icon} alt="" className={`min-w-full object-contain ${accentClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm leading-tight truncate">{test.title}</h3>
                        <p className="text-slate-500 text-xs mt-0.5">
                            {minutes} min
                            {test?.totalQuestions != null && ` · ${test.totalQuestions} ${test.totalQuestions === 1 ? "part" : "parts"}`}
                        </p>
                    </div>
                    {isCompleted && (
                        <span className="badge badge-success badge-xs shrink-0">Done</span>
                    )}
                </div>

                {/* Description */}
                {test.description && (
                    <p className="text-slate-400 text-xs line-clamp-2">{test.description}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                    <span className={`badge badge-xs font-semibold ${DIFFICULTY_COLORS[difficulty]}`}>
                        {difficulty}
                    </span>
                    {isCompleted && test.overallBand != null && (
                        <span className="badge badge-ghost badge-xs text-[10px]">
                            Band {test.overallBand.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* Actions (Stays anchored to the bottom) */}
            <div className="w-full mt-2">
                {canStart ? (
                    <Button 
                        label={isCompleted ? "Review" : "Take Exam"}
                        onClick={() => navigate(`/mud/exam/${skillRoute}/${test._id}`)}
                        icon={isCompleted ? <Eye size={16} /> : <PlayCircle size={16} />}
                        className="w-full"
                        variant="save"
                    />
                ) : (
                    <Button
                        label="Unlock Exam"
                        variant="gold"
                        icon={<Lock size={16} />}
                        onClick={() => navigate('/payment')}
                        className="w-full"
                    /> 
                )}
            </div>
        </div>
    );
}
