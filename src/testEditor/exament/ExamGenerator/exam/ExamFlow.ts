import {createContext, type ReactNode, useContext } from "react";
import {type CardForm } from "../../../card/carde.ts";

export type SkillKey = "writeTest" | "readTest" | "listenTest" | "speakTest";

export interface SkillStep {
    key:   SkillKey;
    id:    string;
    route: string;
}

export interface ExamFlow {
    card:         CardForm;
    steps:        SkillStep[];
    currentIndex: number;
    totalSteps:   number;
    prevStep:     SkillStep | null;
    nextStep:     SkillStep | null;
    isFirst:      boolean;
    isLast:       boolean;
    goNext:       () => void;
    goPrev:       () => void;
    goFinish:     () => void;
}

const SKILL_ROUTE_PREFIX: Record<SkillKey, string> = {
    writeTest:  "/exam/write",
    readTest:   "/exam/read",
    listenTest: "/exam/listen",
    speakTest:  "/exam/speak",
};

const SKILL_ORDER: SkillKey[] = ["writeTest", "readTest", "listenTest", "speakTest"];

export function buildExamSteps(card: CardForm): SkillStep[] {
    return SKILL_ORDER.flatMap((key) => {
        const skill = card?.[key] as { _id?: string } | undefined;
        if (!skill?._id) return [];
        return [{ key, id: skill._id, route: `${SKILL_ROUTE_PREFIX[key]}/${skill._id}` }];
    });
}

export const ExamNavContext = createContext<ExamFlow | null>(null);

/**
 * Consume exam navigation from any skill page.
 * Must be used inside <ExamShell>.
 */
export function useExamNav(): ExamFlow {
    const ctx = useContext(ExamNavContext);
    if (!ctx) throw new Error("useExamNav must be used inside <ExamShell>");
    return ctx;
}

export interface ExamShellProps {
    skillKey: SkillKey;
    children: ReactNode;
}