import React, { useEffect, useState } from "react";
import {
    Clock,
    Calendar,
    Loader2,
    BookOpen,
    AlertCircle,
    CheckCircle2,
    RefreshCcw,
    Target,
} from "lucide-react";
//import { useNavigate } from "react-router";
import { userService } from "../../context/authService";
import { Button } from "../../ui/UI";

/** image */
import Icon from "../../assets/menu icon-14.png"

interface Session {
    _id: string;
    testModel: "Listening" | "Reading" | "Writing" | "Speaking";
    score: number;
    status: "scoring" | "completed" | "failed";
    createdAt: string;
    completedAt?: string;
    timeSpent: number;
    accuracy?: number;
    isFirstTime: boolean;
}


const statusBadge = (status: Session["status"]) => {
    switch (status) {
        case "completed":
            return (
                <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400">
                    <CheckCircle2 size={12} />
                    Completed
                </span>
            );

        case "scoring":
            return (
                <span className="flex items-center gap-1 rounded-full bg-yellow-500/15 px-2 py-1 text-xs font-semibold text-yellow-400">
                    <Loader2 className="animate-spin" size={12} />
                    Scoring
                </span>
            );

        default:
            return (
                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-400">
                    <AlertCircle size={12} />
                    Failed
                </span>
            );
    }
};

const bandColor = (score: number) => {
    if (score >= 8) return "text-emerald-400";
    if (score >= 7) return "text-blue-400";
    if (score >= 6) return "text-yellow-400";
    return "text-rose-400";
};

const SessionHistory: React.FC = () => {

    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    //const navigate = useNavigate();

    useEffect(() => {
        load();
    }, []);

    async function load() {
        setLoading(true);

        try {
            const res = await userService.getAllSessions(1);
            setSessions(res.data.sessions);
        } finally {
            setLoading(false);
        }
    }

    const completedSessions = sessions.filter(s => s.score != null);
    const average = completedSessions.length === 0 ? 0 : (completedSessions.reduce(
                  (sum, s) => sum + (s.score ?? 0),
                  0
              ) / completedSessions.length
          ).toFixed(1);

    /*const average =
        sessions.length === 0
            ? 0
            : (
                sessions.reduce((a, b) => a + (b.score ?? 0), 0) /
                sessions.length
            ).toFixed(1);*/

    const completed = sessions.filter(
        (s) => s.status === "completed"
    ).length;

    return (
        <div className="mx-auto max-w-7xl p-6 space-y-8">

            <div>
                <h1 className="text-3xl font-bold text-white">
                    Test History
                </h1>

                <p className="text-slate-400 mt-2">
                    Review all your IELTS practice sessions.
                </p>
            </div>

            {/* Statistics */}

            <div className="grid gap-4 md:grid-cols-4">

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                        Total Sessions
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-white">
                        {sessions.length}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                        Average Band
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-indigo-400">
                        {average}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                        Completed
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-emerald-400">
                        {completed}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                    <p className="text-sm text-slate-400">
                        Best Band
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-yellow-400">
                        {Math.max(...sessions.map((s) => s.score), 0)}
                    </h2>
                </div>

            </div>

            {loading && (
                <div className="flex justify-center py-20">
                    <Loader2
                        size={40}
                        className="animate-spin text-indigo-400"
                    />
                </div>
            )}

            {!loading && sessions.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 p-20 text-center">

                    <BookOpen
                        size={50}
                        className="mx-auto text-slate-600"
                    />

                    <h2 className="mt-4 text-xl font-semibold text-white">
                        No sessions yet
                    </h2>

                    <p className="mt-2 text-slate-500">
                        Complete your first IELTS practice test.
                    </p>

                </div>
            )}

            {!loading && sessions.length > 0 && (

                <div className="grid gap-5 lg:grid-cols-2">

                    {sessions.map((session) => (

                        <div
                            key={session._id}
                            className="group cursor-pointer rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-indigo-500 hover:bg-slate-800"
                        >

                            <div className="flex items-start justify-between">

                                <div>

                                    <div className="flex items-center gap-2 text-indigo-400">

                                        {/*moduleIcon(session.testModel)*/}
                                        <img className="w-20 h-20" src={Icon} alt="icon aila" />

                                        <span className="font-semibold">
                                            {session.testModel}
                                        </span>

                                    </div>

                                    <div className="mt-3">
                                        {statusBadge(session.status)}
                                    </div>

                                </div>

                                <div className="text-right">

                                    <p className="text-xs uppercase text-slate-500">
                                        Band
                                    </p>

                                    <h2
                                        className={`text-4xl font-bold ${
                                            session.score != null ? bandColor(session.score) : "text-slate-500"
                                        }`}
                                    >
                                        {session.score != null ? session.score.toFixed(1) : "--"}
                                    </h2>

                                </div>

                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">

                                <div className="flex items-center gap-2 text-slate-400">
                                    <Calendar size={15} />
                                    {new Date(
                                        session.createdAt
                                    ).toLocaleDateString()}
                                </div>

                                <div className="flex items-center gap-2 text-slate-400">
                                    <Clock size={15} />
                                    {Math.floor(session.timeSpent / 60)} min
                                </div>

                                <div className="flex items-center gap-2 text-slate-400">
                                    <Target size={15} />
                                    {session.accuracy != null
                                        ? `${Math.round(
                                            session.accuracy * 100
                                        )}%`
                                        : "-"}
                                </div>

                                <div className="text-slate-400">
                                    {session.isFirstTime
                                        ? "🎉 First Attempt"
                                        : ""}
                                </div>

                            </div>

                            <div className="mt-6 flex justify-end">

                                {/* The button to open modal */}
                                <label htmlFor="my_modal_7" className="btn">open modal</label>

                                {/* Put this part before </body> tag */}
                                <input type="checkbox" id="my_modal_7" className="modal-toggle" />
                                <div className="modal" role="dialog">
                                <div className="modal-box">
                                    <h3 className="text-lg font-bold">Hello!</h3>
                                    <p className="py-4">This modal works with a hidden checkbox!</p>
                                </div>
                                <label className="modal-backdrop" htmlFor="my_modal_7">Close</label>
                                </div>
                            </div>

                            {session.status === "failed" && (

                                <div className="mt-4">

                                    <Button
                                        label="Retry AI Scoring"
                                        icon={<RefreshCcw size={15} />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // retry session here
                                        }}
                                    />
                                </div>

                            )}

                        </div>
                    ))}

                </div>
            )}
        </div>
    );
};

export default SessionHistory;