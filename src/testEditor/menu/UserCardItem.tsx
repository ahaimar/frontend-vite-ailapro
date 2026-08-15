import type React from "react";
import { Link, useNavigate } from "react-router";
import { BookOpen, Headphones, Lock, Mic, PenLine, Zap } from "lucide-react";
import type { IELTSCard, SkillKey } from "../card/carde.ts";
import { useAuthStore, type UserWithAttemptSummary } from "../../context/authStore.ts";
import { Button } from "../../ui/UI.tsx";
import ICON from "../a1/menu icon-14.png";

// --- Constants (Moved outside component) ---
const SKILL_KEYS: SkillKey[] = ["writing", "reading", "listening", "speaking"];

const SKILL_META: Record<SkillKey, { label: string; Icon: React.FC<{ size?: number }> }> = {
  writing: { label: "Writing", Icon: PenLine },
  reading: { label: "Reading", Icon: BookOpen },
  listening: { label: "Listening", Icon: Headphones },
  speaking: { label: "Speaking", Icon: Mic },
};

const DIFF_STYLES: Record<string, { dot: string; text: string }> = {
  Easy: { dot: "bg-green-500", text: "text-green-400" },
  Medium: { dot: "bg-amber-500", text: "text-amber-400" },
  Hard: { dot: "bg-red-500", text: "text-red-400" },
  Mixed: { dot: "bg-violet-500", text: "text-violet-400" },
};

// --- Helpers ---
const getSkillTitle = (card: IELTSCard, key: SkillKey) => {
  const map: Record<SkillKey, string | undefined> = {
    writing: card.writeTest?.title,
    reading: card.readTest?.title,
    listening: card.listenTest?.title,
    speaking: card.speakTest?.title,
  };
  return map[key] || "No title";
};

type AttemptStatusResult = {
  canAttempt: boolean;
  reason: "not_authenticated" | "access_locked" | "daily_limit_reached" | "total_limit_reached" | "subscription_expired" | "available";
  message?: string;
  nextResetAt?: string | null;
  remainingDaily?: number | null;
};

/**
 * Determines whether the user can start this card's exam and why/why not.
 * `low_daily_attempts` is deliberately NOT a blocking case here — it's a
 * soft warning surfaced elsewhere (remaining-attempts line below), not a
 * reason to prevent the attempt.
 */
const getAttemptStatus = (user: UserWithAttemptSummary | null, card: IELTSCard): AttemptStatusResult => {
  if (!user) return { canAttempt: false, reason: "not_authenticated" };

  const canAccess = card.accessType === "free" || user.is_subscription || user.role === "admin" || user.dailyAttemptsUsed !== user.attemptsUsed;
  if (!canAccess) {
    return { canAttempt: false, reason: "access_locked", message: "Unlock with subscription" };
  }

  if (user.attemptStatus === "daily_limit_reached") {
    return {
      canAttempt: false,
      reason: "daily_limit_reached",
      message: "Daily limit reached. Try again tomorrow.",
      nextResetAt: user.nextResetAt,
    };
  }

  if (user.attemptStatus === "total_limit_reached") {
    return {
      canAttempt: false,
      reason: "total_limit_reached",
      message: "Total attempts exhausted. Upgrade your plan.",
    };
  }

  if (user.attemptStatus === "subscription_expired") {
    return {
      canAttempt: false,
      reason: "subscription_expired",
      message: "Subscription expired. Renew to continue.",
    };
  }

  // 'available' or 'low_daily_attempts' both land here — both allow the attempt.
  return {
    canAttempt: true,
    reason: "available",
    remainingDaily: user.remainingDailyAttempts,
  };
};

export const UserCardItem: React.FC<{ card: IELTSCard }> = ({ card }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const linkedCount = SKILL_KEYS.filter((s) => card.skills?.[s] != null).length;

  const attemptStatus = getAttemptStatus(user, card);
  const canStart = attemptStatus.canAttempt;

  const diff = card.metadata?.difficulty || "Mixed";
  const styles = DIFF_STYLES[diff] || DIFF_STYLES.Mixed;

  const timeExam = card.metadata?.estimatedDuration;

  // Only show "X of Y remaining" for capped, non-unlimited plans with a real number.
  const showRemainingAttempts =
    !!user && !user.isUnlimited && typeof user.remainingDailyAttempts === "number";

  const isLowOnAttempts = user?.attemptStatus === "low_daily_attempts";

  const handleCtaClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (attemptStatus.reason === "not_authenticated") {
      navigate('/login');
    } else if (attemptStatus.reason === "access_locked") {
      navigate('/payment');
    } else {
      navigate('/profile'); // Show subscription/attempt details
    }
  };

  const Wrapper = canStart ? Link : "div";
  const wrapperProps = canStart
    ? { to: `/tasks/${card._id}` }
    : {};

  return (
    <Wrapper
      {...(wrapperProps as any)}
      className="group block focus-visible:outline-none"
    >
      <article
        role="article"
        aria-label={card.title}
        className={`relative flex flex-col overflow-hidden bg-slate-900 border rounded-2xl transition-all duration-200 
          ${canStart ? "border-slate-700/50 hover:border-indigo-500/50 hover:-translate-y-0.5" : "border-slate-700/50 opacity-80"}`}
      >
        {/* Glow Effect */}
        {canStart && (
          <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.08),transparent_60%)]" />
        )}

        {/* Unlimited badge */}
        {user?.isUnlimited && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-linear-to-r from-amber-500/30 to-orange-500/30 border border-amber-500/50">
            <Zap size={12} className="text-amber-400" />
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wide">Unlimited</span>
          </div>
        )}

        <div className="flex flex-col gap-0 px-5 pt-5 pb-4 flex-1">
          <div className="flex gap-3 mb-3">
            <img src={ICON} alt="" className="w-10 h-10 rounded border border-slate-700/50 object-cover" />
            <div className="flex flex-col flex-1">
              <h3 className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">{card.title}</h3>
              <div className="flex gap-1 items-center mt-1 flex-wrap">
                <span className="text-[10px] text-base-content italic capitalize">{timeExam} min</span>
                <span className="text-[10px] text-base-content italic capitalize">| Tasks {card.writeTest?.tasks?.length || 2}</span>
                <span className="text-[10px] text-base-content italic capitalize">| Sections {card.readTest?.sections?.length || 4}</span>
                <span className="text-[10px] text-base-content italic capitalize">| Passages {card.listenTest?.passages?.length || 3}</span>
                <span className="text-[10px] text-base-content italic capitalize">| Parts {card.speakTest?.parts?.length || 3}</span>
              </div>
            </div>
          </div>

          <div className="m-1 w-full capitalize text-sm font-bold text-base-content">
            <p className="line-clamp-2">
              {card.description}
            </p>
          </div>

          {/* Skills Pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {SKILL_KEYS.map((sk) => {
              const { label, Icon } = SKILL_META[sk];
              const active = card.skills?.[sk] != null;
              return (
                <span
                  key={sk}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                    active ? "bg-indigo-900/40 border-indigo-500/40 text-indigo-300" : "bg-slate-800/40 border-slate-700 text-slate-600"
                  }`}
                  title={getSkillTitle(card, sk)}
                >
                  <Icon size={9} />
                  {label}
                </span>
              );
            })}
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${card.accessType === "free" ? "border-emerald-500/30 text-emerald-400" : "border-slate-600 text-slate-400"}`}>
              {card.accessType}
            </span>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${styles.dot}`} />
              <span className={`text-[10px] font-semibold uppercase ${styles.text}`}>{diff}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-2 px-5 py-3 border-t border-slate-700/40 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">{linkedCount} skills</span>
            {!canStart && (
              <Button
                label={attemptStatus.reason === "access_locked" ? "Unlock" : "See Details"}
                icon={<Lock size={12} />}
                variant={attemptStatus.reason === "access_locked" ? "gold" : "submit"}
                onClick={handleCtaClick}
              />
            )}
          </div>

          {!canStart && attemptStatus.message && (
            <div className={`text-xs italic px-2 py-1 rounded border ${
              attemptStatus.reason === "daily_limit_reached"
                ? "bg-amber-900/20 border-amber-600/40 text-amber-300"
                : "bg-red-900/20 border-red-600/40 text-red-300"
            }`}>
              {attemptStatus.message}
              {attemptStatus.nextResetAt && (
                <div className="text-[9px] mt-0.5 opacity-75">
                  Resets {new Date(attemptStatus.nextResetAt).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {canStart && showRemainingAttempts && (
            <div className={`flex items-center gap-1 text-xs ${isLowOnAttempts ? "text-warning" : "text-info"}`}>
              <span className="font-semibold">{attemptStatus.remainingDaily}</span>
              <span className="opacity-75">of {user?.maxDailyAttempts} daily attempts remaining</span>
            </div>
          )}
        </div>
      </article>
    </Wrapper>
  );
};