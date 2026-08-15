import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import SEO from "../../components/layout/SEO";
import WRITE from "../a1/test icon-27.png";
import LISTEN from "../a1/test icon-25.png";
import READ from "../a1/test icon-26.png";
import SPEAK from "../a1/test icon-28.png";
import MAIN_UNLOCKED from "../a1/menu icon-14.png";
import MAIN_LOCKED from "../a1/menu icon-15.png";
import ForWrite from "../a1/menu icon-17.png";
import ForRead from "../a1/menu icon-16.png";
import ForListen from "../a1/menu icon-18.png";
import ForSpeak from "../a1/menu icon-20.png";
import ForExam from "../a1/menu icon-19.png";

/** Components */
import ExamLibrary from "./ExamLibrary";
import { ListenMudel, ReadMudel, SpeakMudel, WriteMudel } from "./Models";
import { type UserWithAttemptSummary } from "../../context/authStore";
import { Badge } from "../../ui/UI";
import { AlertCircle, Zap, Clock, InfinityIcon } from "lucide-react";
import type { SubscriptionPlan, User } from "../../hooks/Utils";
import { userService } from "../../context/authService";
import { useToast } from "../../ui";
import { ToastBanner } from "../../ui/Toest";
import { EXAM_ROUTES, getDailyAttemptsLimit, urlSegmentToTabId, type TabId } from "./exam";

interface SkillTab {
  id: TabId;
  label: string;
  icon: string;
  component: React.ComponentType;
}

const SKILL_TABS: SkillTab[] = [
  { id: "writing", label: "Writing", icon: WRITE, component: WriteMudel },
  { id: "listening", label: "Listening", icon: LISTEN, component: ListenMudel },
  { id: "reading", label: "Reading", icon: READ, component: ReadMudel },
  { id: "speaking", label: "Speaking", icon: SPEAK, component: SpeakMudel },
];

const BG_ICON: Record<TabId, string> = {
  writing: ForWrite,
  listening: ForListen,
  reading: ForRead,
  speaking: ForSpeak,
  simulator: ForExam,
};

const formatRemainingAttempts = (user: UserWithAttemptSummary | null) => {
  if (!user) return "Loading...";
  if (user.isUnlimited || user.subscription === 'unlimited') return <div className="flex text-2xl">{user.dailyAttemptsUsed | 0 }/<InfinityIcon className="text-amber-500" /></div>;

  const remaining = user.dailyAttemptsUsed ?? 0;
  const max = user.maxDailyAttempts ?? 0;

  if (remaining <= 0) {
    return `0 / ${max} (Reset tomorrow)`;
  }

  return `${remaining} / ${max} remaining today`;
};

type AttemptSeverity = "unlimited" | "ok" | "warning" | "error" | "loading";

const getAttemptSeverity = (user: UserWithAttemptSummary | null): AttemptSeverity => {
  if (!user) return "loading";
  if (user.isUnlimited) return "unlimited";

  const remaining = user.remainingDailyAttempts ?? 0;
  if (remaining <= 0) return "error";
  if (remaining <= 2) return "warning";
  return "ok";
};

const SEVERITY_TEXT_CLASS: Record<AttemptSeverity, string> = {
  unlimited: "text-amber-400",
  ok: "text-info",
  warning: "text-warning",
  error: "text-error",
  loading: "opacity-50",
};

const SEVERITY_ICON_CLASS: Record<AttemptSeverity, string> = {
  unlimited: "text-amber-400",
  ok: "text-info",
  warning: "text-warning",
  error: "text-error",
  loading: "text-slate-500",
};

const AttemptStatusBanner: React.FC<{ user: UserWithAttemptSummary | null }> = ({ user }) => {
  if (!user || user.isUnlimited) return null;

  const remaining = getDailyAttemptsLimit(user.subscription as SubscriptionPlan);

  if (remaining === user?.attemptsUsed) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-error/10 border border-error/30 text-error-content">
        <AlertCircle size={16} />
        <div className="flex-1">
          <p className="text-sm font-semibold">Daily limit reached</p>
          <p className="text-xs opacity-75">You can attempt again tomorrow at midnight UTC</p>
        </div>
      </div>
    );
  }

  if (remaining <= 2) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning-content">
        <Clock size={16} />
        <div className="flex-1">
          <p className="text-sm font-semibold">{remaining} attempt{remaining === 1 ? '' : 's'} remaining today</p>
          <p className="text-xs opacity-75">Use them wisely! Resets at midnight UTC.</p>
        </div>
      </div>
    );
  }

  return null;
};

function Menu() {
  const navigate = useNavigate();
  const { module } = useParams<{ module?: string }>();

  // The URL param is the single source of truth for which tab is active.
  // urlSegmentToTabId is the ONLY function that decides this mapping —
  // used here for both the initial render and any later navigation.
  const [activeTab, setActiveTab] = useState<TabId>(() => urlSegmentToTabId(module));

  useEffect(() => {
    setActiveTab(urlSegmentToTabId(module));
  }, [module]);

  const [user, setUser] = useState<User | null>(null);
  const { toast, show: showToast } = useToast();

  const isSubscribed = Boolean(user?.is_subscription as boolean);
  const severity = getAttemptSeverity(user);

  const tabClass = (tabId: TabId) => `
    tab h-auto flex flex-col items-center justify-center gap-0.5 border-b transition-all duration-200 min-w-[100px]
    ${activeTab === tabId
      ? "text-blue-400 border-blue-500 opacity-100 scale-105"
      : "text-slate-400 border-transparent opacity-70 hover:opacity-100"}
  `;

  const ActiveComponent = SKILL_TABS.find((t) => t.id === activeTab)?.component;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await userService.getUserBySub();
        setUser(response.data?.user);
      } catch (error) {
        const err = error as Error;
        console.error(err.message);
        showToast('Failed to get user info', 'ERROR');
      }
    };
    fetchUser();
  }, []);

  return (
    <>
      <SEO
        title="IELTS Exam Menu"
        description="Choose your IELTS skill and start practicing under real exam conditions."
        canonicalUrl="https://menu.com"
      />

      <img
        src={BG_ICON[activeTab]}
        alt=""
        aria-hidden="true"
        className="pointer-events-none select-none absolute top-10 right-10 z-1 w-32 h-32 md:w-40 md:h-40 object-contain opacity-20"
      />

      <div className="w-full bg-base-300/90 min-h-screen text-white">
        <ToastBanner toast={toast} />
        <div className="relative w-full h-auto p-1 overflow-hidden">
          <p className="relative z-10 text-primary uppercase italic">applicant</p>
          <h1 className="relative z-10 text-base-content text-2xl font-mono capitalize p-1">
            IELTS exam simulator
          </h1>
        </div>

        {/* Attempt Status Section */}
        <div className="w-full p-1 px-40 max-w-7xl mx-auto mb-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between px-4 py-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              {user?.isUnlimited ? (
                <>
                  <Zap className="text-amber-400" size={20} />
                  <div>
                    <p className="text-sm font-semibold text-amber-300">Unlimited Plan Active</p>
                    <p className="text-xs text-slate-400">Unlimited daily attempts</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className={`size-5 ${SEVERITY_ICON_CLASS[severity]}`} />
                  <div>
                    <p className={`text-sm font-semibold ${SEVERITY_TEXT_CLASS[severity]}`}>
                      {formatRemainingAttempts(user)}
                    </p>
                    <p className="text-xs text-slate-400">Daily limit — resets at midnight UTC</p>
                  </div>
                </>
              )}
            </div>

            {user && (
              <div className="flex gap-2">
                <Badge
                  label={`${getDailyAttemptsLimit(user.subscription as SubscriptionPlan)} choices on this day`}
                  variant="outline"
                  size="sm"
                />
                <Badge
                  label={`Plan: ${user?.subscription || 'free'}`}
                  variant="ghost"
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="w-full px-10 mb-4">
          <AttemptStatusBanner user={user} />
        </div>

        {/* Tabs Section */}
        <div className="w-full p-1 max-w-7xl mx-auto">
          <div
            role="tablist"
            aria-label="Exam skills"
            className="flex flex-wrap justify-center gap-1 md:gap-1 border-b border-slate-800"
          >
            {SKILL_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => navigate(EXAM_ROUTES.menuTab(tab.id))}
                className={tabClass(tab.id)}
              >
                <img
                  src={tab.icon}
                  className={`w-10 h-10 object-contain transition-opacity duration-200 ${
                    activeTab === tab.id ? "opacity-100" : "opacity-40"
                  }`}
                  alt={`${tab.label} skill`}
                />
                <span className="text-xs md:text-sm font-semibold tracking-wide">
                  {tab.label}
                </span>
              </button>
            ))}

            {/* Exam Simulator Tab */}
            <button
              role="tab"
              aria-selected={activeTab === "simulator"}
              onClick={() => navigate(EXAM_ROUTES.menuTab("simulator"))}
              className={`${tabClass("simulator")} flex flex-col items-center justify-center bg-linear-to-t from-amber-500/70 to-amber-950/10 rounded-lg`}
            >
              <div className="flex items-center">
                <img
                  src={isSubscribed ? MAIN_UNLOCKED : MAIN_LOCKED}
                  className="w-15 h-20 object-contain"
                  alt="Exam Simulator"
                />
              </div>
              <span className="text-xs md:text-sm font-semibold tracking-wide text-white">
                IELTS Exam Simulator
              </span>
            </button>
          </div>

          {/* Content Display Area */}
          <div
            role="tabpanel"
            className="mt-8 bg-base-100 rounded-2xl border border-slate-800 p-6 md:p-8 min-h-75"
          >
            {activeTab === "simulator" ? (
              <ExamLibrary />
            ) : (
              ActiveComponent && <ActiveComponent />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Menu;