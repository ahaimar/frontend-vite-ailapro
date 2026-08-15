/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AILA - Complete Type Definitions
 * Matches the new subscription system and attempt tracking
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Core Enums & Literals ────────────────────────────────────────────────────

export type Role = 'admin' | 'teacher' | 'subscriber' | 'guest';
export type Status = 'active' | 'suspended' | 'pending_verification' | 'deleted';
export type SubscriptionPlan = 'free' | 'pro' | 'unlimited';
export type TestType = 'Academic' | 'General' | 'Training';
export type TargetType = 'academic' | 'general' | 'both';
export type AuthProvider = 'local' | 'google';
export type Module = 'listening' | 'reading' | 'writing' | 'speaking';

// ─── Audit / Logging ─────────────────────────────────────────────────────────

export type AuditAction =
  | 'login'
  | 'signup'
  | 'logout'
  | 'guest_login'
  | 'role_change'
  | 'user_suspended'
  | 'force_logout'
  | 'user_deleted'
  | 'subscription_updated'
  | 'subscription_renewed'
  | 'trial_started'
  | 'attempts_reset'
  | 'user_profile_updated';

export interface AuditLogEntry {
  _id: string;
  userId: string;
  name: string;
  action: AuditAction;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─── Weak Areas (Learning Profile) ────────────────────────────────────────────

export interface WeakArea {
  module: Module;
  questionType?: string;
  accuracyRate: number; // 0–100
  attempts: number;
  lastUpdated: string; // ISO string
}

// ─── Subscription & Attempt Summary ────────────────────────────────────────────

/**
 * Attempt summary as returned by `User.getAttemptSummary()` on the backend.
 * 
 * Key principle: `null` fields mean "no limit" (unlimited plan) — never use
 * numeric sentinels like -1. Consumers check `isUnlimited` or `remainingXxx === null`.
 * 
 * The `attemptStatus` field is the single source of truth for UI branching:
 *   - 'available' - user can attempt
 *   - 'low_daily_attempts' - < 3 attempts remaining
 *   - 'daily_limit_reached' - 0 attempts today (reset tomorrow)
 *   - 'total_limit_reached' - plan limit exhausted
 *   - 'subscription_expired' - must renew to continue
 */
export interface AttemptSummary {
  // Usage tracking
  attemptsUsed: number; // Lifetime total (never resets)
  dailyAttemptsUsed: number; // Today's count (resets daily at midnight UTC)

  // Plan info
  planTier: SubscriptionPlan;
  isUnlimited: boolean;

  // Subscription status
  is_subscription: boolean; // true if active or in trial
  isSubscriptionActive: boolean;
  isInTrial: boolean;
  isSubscriptionExpired: boolean;

  // Remaining attempts (null = unlimited, don't show progress bar)
  remainingDailyAttempts: number | null;
  remainingTotalAttempts: number | null;

  // Max limits (null = unlimited)
  maxDailyAttempts: number | null;
  maxTotalAttempts: number | null;

  // Can user attempt now?
  canAttempt: boolean;

  // UI branching status (mutually exclusive, most severe first)
  attemptStatus:
    | 'available'
    | 'low_daily_attempts'
    | 'daily_limit_reached'
    | 'total_limit_reached'
    | 'subscription_expired';

  // Timestamps for UI countdowns
  nextResetAt: string | null; // Tomorrow midnight UTC (ISO string)
  daysUntilExpiry: number | null; // Days until subscription expires (for renewal warnings)
  subscriptionExpiresAt: string | null; // Full expiry timestamp (ISO string)
  trialEndsAt: string | null; // Trial end timestamp (ISO string)
}

// ─── User Document ────────────────────────────────────────────────────────────

/**
 * Complete User document from Mongoose.
 * Mirrors User.js schema exactly.
 */
export interface User {
  // Identity
  _id: string;
  name: string;
  email?: string;

  // Authentication
  passwordHash?: string; // Never sent to frontend
  googleId?: string;
  authProvider: AuthProvider;
  emailVerified: boolean;

  // Login security
  loginAttempts: number;
  lockedUntil?: string | Date | null;
  lastLoginAt?: string | Date | null;
  lastLoginIp?: string;
  loginCount: number;

  // Account status
  role: Role;
  status: Status;
  isGuest: boolean;
  guestExpiresAt?: string | Date | null;
  deletedAt?: string | Date | null;

  // ✅ Subscription & Plan (NEW FIELDS)
  isUnlimited: boolean;
  is_subscription: boolean;
  subscription: SubscriptionPlan;
  subscription_expires_at?: string | Date | null; // When subscription expires
  subscription_renewed_at?: string | Date | null; // When last renewed
  trial_ends_at?: string | Date | null; // When trial expires
  trial_started_at?: string | Date | null; // When trial started

  // ✅ Exam Attempts (AUTO-MANAGED)
  attemptsUsed: number; // Lifetime total (never resets)
  lastAttemptDate?: string | Date | null; // Used to detect new calendar day
  dailyAttemptsUsed: number; // Today's count (resets at midnight UTC)

  // Learning profile
  targetType: TargetType;
  targetScore?: number;
  testType: TestType;
  currentBandEstimate?: number | null;
  weakAreas: WeakArea[];

  // Profile
  avatarUrl?: string;
  timezone: string;
  country?: string;

  // Metadata
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

/**
 * User with attempt summary attached.
 * 
 * Backend returns this from `/auth/me` and other endpoints.
 * Frontend uses this in UI to avoid recalculating attempt status.
 * 
 * Fields from AttemptSummary are optional (Partial) because:
 *   - Some responses may not include them (backward compat)
 *   - Type system should not require them
 *   - Consumers can check `user?.attemptSummary?.canAttempt`
 */
export type UserWithAttemptSummary = User & Partial<AttemptSummary>;

// ─── Auth Store ───────────────────────────────────────────────────────────────

export interface AuthState {
  // Current user
  user: UserWithAttemptSummary | null;

  // Permissions (from backend, based on role)
  permissions: string[];

  // Loading state
  loading: boolean; // true while fetching
  ready: boolean; // true once initial check complete

  // User management
  setUser: (user: UserWithAttemptSummary | null, permissions?: string[]) => void;
  clearUser: () => void;

  // Session management
  checkSession: () => Promise<void>; // Called on app mount
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
  guestLogin: (name: string) => Promise<void>;
  googleAuth: (credential: string) => Promise<void>;
  logout: () => Promise<void>;

  // Helpers
  hasPermission: (perm: string) => boolean;
  isGuest: () => boolean;
  isAdmin: () => boolean;
  isTeacher: () => boolean;
  isSubscriber: () => boolean;
}

// ─── API Responses ────────────────────────────────────────────────────────────

/**
 * Standard successful response structure.
 * Backend wraps all data in `{ data: { ... } }` or `{ error: "..." }`.
 */
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message?: string;
  statusCode?: number;
}

/**
 * Login/Signup response
 */
export interface AuthResponse {
  token: string;
  user: UserWithAttemptSummary;
  permissions: string[];
}

/**
 * Get user (e.g., from /auth/me or /admin/users/:id)
 */
export interface GetUserResponse {
  user: UserWithAttemptSummary;
  permissions: string[];
  attemptSummary?: AttemptSummary; // Optional, included in some responses
}

/**
 * List users (admin endpoint)
 */
export interface ListUsersResponse {
  users: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Attempt check (before starting exam)
 */
export interface CanAttemptResponse {
  canAttempt: boolean;
  reason?: string; // 'subscription_expired', 'daily_limit_reached', etc.
  message?: string;
  attemptStatus?: AttemptSummary['attemptStatus'];
  remainingDailyAttempts?: number | null;
  nextResetAt?: string | null;
}

/**
 * Platform statistics (admin endpoint)
 */
export interface PlatformStats {
  totals: {
    total: number;
    active: number;
    guests: number;
  };
  byRole: Array<{ role: Role; count: number }>;
  bySubscription: Array<{ plan: SubscriptionPlan; count: number }>;
}

// ─── Admin Operations ─────────────────────────────────────────────────────────

/**
 * Payload for subscribing/renewing a user
 */
export interface SubscribeUserPayload {
  plan: SubscriptionPlan;
  daysFromNow?: number; // Optional, uses plan default if not provided
}

/**
 * Payload for starting a trial
 */
export interface StartTrialPayload {
  trialDays?: number; // Default: 14
}

/**
 * Payload for resetting attempts
 */
export interface ResetAttemptsPayload {
  type: 'daily' | 'total' | 'both';
}

/**
 * Payload for updating user profile (safe fields only)
 */
export interface UpdateUserPayload {
  name?: string;
  avatarUrl?: string;
  timezone?: string;
  country?: string;
  targetType?: TargetType;
  targetScore?: number;
  testType?: TestType;
  currentBandEstimate?: number;
}

/**
 * Payload for updating user role (admin only)
 */
export interface UpdateRolePayload {
  role: Role;
}

/**
 * Payload for updating user status (admin only)
 */
export interface UpdateStatusPayload {
  status: Status;
}

// ─── Form / UI Models ─────────────────────────────────────────────────────────

/**
 * Form data for user signup
 */
export interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

/**
 * Form data for user login
 */
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

/**
 * Form data for guest login
 */
export interface GuestLoginFormData {
  name: string;
}

/**
 * Form data for profile editing
 */
export interface EditProfileFormData {
  name: string;
  email?: string;
  timezone: string;
  country?: string;
  avatarUrl?: string;
  targetType: TargetType;
  targetScore?: number;
  testType: TestType;
}

// ─── Utility Types ────────────────────────────────────────────────────────────

/**
 * Exam card / test model
 */
export interface ExamCard {
  _id: string;
  title: string;
  description?: string;
  accessType: 'free' | 'premium';
  skills?: {
    writing?: boolean;
    reading?: boolean;
    listening?: boolean;
    speaking?: boolean;
  };
  metadata?: {
    difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    estimatedDuration?: number;
  };
  writeTest?: {
    title?: string;
    tasks?: Array<any>;
  };
  readTest?: {
    title?: string;
    sections?: Array<any>;
  };
  listenTest?: {
    title?: string;
    passages?: Array<any>;
  };
  speakTest?: {
    title?: string;
    parts?: Array<any>;
  };
}

/**
 * Exam session (in progress)
 */
export interface ExamSession {
  _id: string;
  userId: string;
  cardId: string;
  skillType: Module;
  startedAt: string; // ISO string
  completedAt?: string; // ISO string
  status: 'in_progress' | 'completed' | 'abandoned';
  score?: number;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

/**
 * Permission strings granted based on role.
 * Used to gate features on frontend.
 */
export type Permission =
  | 'tests:read_free'
  | 'tests:read'
  | 'tests:attempt'
  | 'students:read'
  | 'admin:all';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: ['tests:read_free'],
  subscriber: ['tests:read', 'tests:attempt'],
  teacher: ['tests:read', 'tests:attempt', 'students:read'],
  admin: ['tests:read', 'tests:attempt', 'students:read', 'admin:all'],
};

// ─── Type Guards ──────────────────────────────────────────────────────────────

/**
 * Type guard: check if user is defined and not null
 */
export const isUserLoaded = (user: UserWithAttemptSummary | null): user is UserWithAttemptSummary => {
  return user !== null && user !== undefined;
};

/**
 * Type guard: check if attempt summary is attached
 */
export const hasAttemptSummary = (
  user: UserWithAttemptSummary | null
): user is UserWithAttemptSummary & AttemptSummary => {
  return (
    isUserLoaded(user) &&
    'attemptStatus' in user &&
    'canAttempt' in user &&
    'remainingDailyAttempts' in user
  );
};

/**
 * Type guard: check if user can attempt
 */
export const canUserAttempt = (user: UserWithAttemptSummary | null): boolean => {
  if (!hasAttemptSummary(user)) return false;
  return user.canAttempt === true;
};

/**
 * Type guard: check if user is admin
 */
export const isAdmin = (user: UserWithAttemptSummary | null): user is UserWithAttemptSummary => {
  return isUserLoaded(user) && user.role === 'admin';
};

/**
 * Type guard: check if user is teacher
 */
export const isTeacher = (user: UserWithAttemptSummary | null): user is UserWithAttemptSummary => {
  return isUserLoaded(user) && user.role === 'teacher';
};

/**
 * Type guard: check if user is guest
 */
export const isGuest = (user: UserWithAttemptSummary | null): user is UserWithAttemptSummary => {
  return isUserLoaded(user) && user.isGuest === true;
};

/**
 * Type guard: check if user has active subscription
 */
export const hasActiveSubscription = (user: UserWithAttemptSummary | null): boolean => {
  if (!hasAttemptSummary(user)) return false;
  return user.isSubscriptionActive === true || user.isInTrial === true;
};

/**
 * Type guard: check if subscription is expired
 */
export const isSubscriptionExpired = (user: UserWithAttemptSummary | null): boolean => {
  if (!hasAttemptSummary(user)) return false;
  return user.isSubscriptionExpired === true;
};