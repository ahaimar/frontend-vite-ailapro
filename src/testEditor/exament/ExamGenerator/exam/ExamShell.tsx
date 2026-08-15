
import React, {useCallback, useEffect, useState} from "react";
import {userService} from "../../../../context/authService.ts";
import {type CardForm, EMPTY_FORM} from "../../../card/carde.ts";
import {useLocation, useNavigate} from "react-router";
import {buildExamSteps, type ExamFlow, ExamNavContext, type ExamShellProps} from "./ExamFlow.ts";


export const ExamShell: React.FC<ExamShellProps> = ({ skillKey, children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const cardId = (location.state as { cardId?: string } | null)?.cardId;

    const [card,    setCard   ] = useState<CardForm>(EMPTY_FORM);
    const [loading, setLoading] = useState(!!cardId);
    const [error,   setError  ] = useState<string | null>(null);

    useEffect(() => {

        if (!cardId) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setError("No card ID provided. Please return to the test library.");
            setLoading(false);
            return;
        }
        setLoading(true);
        userService.fetchCard(cardId)
            .then(res => {
                if (!res.success) throw new Error(res.message ?? "Card not found");
                setCard(res.data);
            })
            .catch((err: unknown) => {
                setError(
                    (err as Error)?.message ?? "Failed to load exam card.",
                );
            })
            .finally(() => setLoading(false));
    }, [cardId]);

    const steps        = buildExamSteps(card);
    const currentIndex = steps.findIndex(s => s.key === skillKey);
    const prevStep     = currentIndex > 0 ? steps[currentIndex - 1] : null;
    const nextStep     = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

    const goNext = useCallback(() => {
        if (nextStep) navigate(nextStep.route, { state: { cardId } });
    }, [nextStep, navigate, cardId]);

    const goPrev = useCallback(() => {
        if (prevStep) navigate(prevStep.route, { state: { cardId } });
    }, [prevStep, navigate, cardId]);

    const goFinish = useCallback(() => {
        navigate("/dashboard");
    }, [navigate]);

    const flow: ExamFlow = {
        card,
        steps,
        currentIndex,
        totalSteps:  steps.length,
        prevStep,
        nextStep,
        isFirst:     currentIndex === 0,
        isLast:      currentIndex === steps.length - 1,
        goNext,
        goPrev,
        goFinish,
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-950">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-950 text-slate-300 p-8">
                <p className="text-rose-400 font-semibold">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="text-xs text-slate-500 underline hover:text-slate-300"
                >
                    Go back
                </button>
            </div>
        );
    }

    return (
        <ExamNavContext.Provider value={flow}>
            <div className="min-h-screen flex flex-col bg-slate-900 text-white">
                <header className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-md bg-indigo-500/20 text-indigo-400
                                         text-xs font-bold uppercase tracking-widest">
                            {skillKey.replace("Test", "")}
                        </span>
                        <h2 className="text-sm font-medium text-slate-400">
                            {card.title || "Loading…"}
                        </h2>
                    </div>
                    {steps.length > 1 && (
                        <div className="text-xs text-slate-500">
                            Step {currentIndex + 1} of {steps.length}
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </ExamNavContext.Provider>
    );
};

