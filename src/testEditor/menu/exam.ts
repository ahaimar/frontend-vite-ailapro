


// The four practice skills
export type SkillId = "writing" | "listening" | "reading" | "speaking";
export const SKILL_IDS: SkillId[] = ["writing", "listening", "reading", "speaking"];

// Every tab shown in the Menu, including the simulator
export type TabId = SkillId | "simulator";

export function isSkillId(value: string | undefined): value is SkillId {
  return !!value && (SKILL_IDS as string[]).includes(value);
}

// The simulator is called "exam" in the URL but "simulator" internally.
// This is the ONLY place that mapping is allowed to exist.
const EXAM_URL_SEGMENT = "exam";

export function tabIdToUrlSegment(tab: TabId): string {
  return tab === "simulator" ? EXAM_URL_SEGMENT : tab;
}

export function urlSegmentToTabId(segment: string | undefined, fallback: TabId = "writing"): TabId {
  if (segment === EXAM_URL_SEGMENT) return "simulator";
  if (isSkillId(segment)) return segment;
  return fallback;
}

export const EXAM_ROUTES = {
  moduleSelect: "/mude-menu",
  menuTab: (tab: TabId) => `/menu/${tabIdToUrlSegment(tab)}`,
} as const;

export const SUBSCRIPTION_CONFIG = {
  free: {
    maxAttempts: 10,
    maxDailyAttempts: 5,
    duration: null,
    price: 0,
  },
  pro: {
    maxAttempts: 50,
    maxDailyAttempts: 25,
    duration: 30,
    price: 19.99,
  },
  unlimited: {
    maxAttempts: Infinity,
    maxDailyAttempts: Infinity,
    duration: 30,
    price: 29.99,
  },
} as const;

// Create a union type of the plan names: 'free' | 'pro' | 'unlimited'
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_CONFIG;

// Lookup helper function
export const getDailyAttemptsLimit = (plan: SubscriptionPlan): number => {
  return SUBSCRIPTION_CONFIG[plan].maxDailyAttempts;
};