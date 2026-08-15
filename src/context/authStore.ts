import {create} from 'zustand';
import {authService} from "./authService.ts";
import {AppError} from "./excaption/AppError.ts";
import type { AttemptSummary, User } from '../hooks/Utils.ts';

export type Role = 'admin' | 'teacher' | 'subscriber' | 'guest';
export type Status = 'active' | 'suspended' | 'pending_verification' | 'deleted';
export type Subscription = 'free' | 'basic' | 'pro' | 'unlimited';
export type TestType = 'Academic' | 'General' | 'Training';

export interface WeakArea {
    module: "listening" | "reading" | "writing" | "speaking";
    questionType: string;
    accuracyRate: number;  // 0–100
    attempts: number;
    lastUpdated: string;   // ISO string
}

// Fields the /me (or equivalent) endpoint attaches on top of the raw User doc.
// Kept separate from User so partial responses don't force these to be required.
export type UserWithAttemptSummary = User & Partial<AttemptSummary>;

export type AuditAction =
    | 'login' | 'signup' | 'logout'
    | 'guest_login' | 'role_change'
    | 'user_suspended' | 'force_logout' | 'user_deleted';

// An audit log entry describes an *action taken*, not a user — it references
// a user by id rather than embedding a full User document.
export interface AuditLogEntry {
    _id: string;
    userId: string;
    action: AuditAction;
    performedBy?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
}

export type AuditLog = {
    logs: AuditLogEntry[];
    total: number;
};

export type AuthState = {
    user: UserWithAttemptSummary | null;
    permissions: string[];
    loading: boolean;
    ready: boolean;

    setUser: (user: UserWithAttemptSummary | null, permissions?: string[]) => void;
    clearUser: () => void;
    checkSession: () => Promise<void>;
    login: (credentials: { email: string; password: string }) => Promise<void>;
    signup: (payload: { name: string; email: string; password: string }) => Promise<void>;
    guestLogin: (name: string) => Promise<void>;
    googleAuth: (credential: string) => Promise<void>;
    logout: () => Promise<void>;

    hasPermission: (perm: string) => boolean;
    isGuest: () => boolean;
    isAdmin: () => boolean;
    isSubscriber: () => boolean;
    isTeacher: () => boolean;
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    permissions: [],
    loading: true,   // true while checking session on mount
    ready: false,     // true once initial check is done

    setUser: (user, permissions = []) => set({user, permissions}),
    clearUser: () => set({user: null, permissions: []}),

    // Called once on app mount
    checkSession: async () => {
        set({loading: true})
        try {
            const {data} = await authService.me()
            set({user: data.user, permissions: data.permissions, loading: false, ready: true})
        } catch {
            set({user: null, permissions: [], loading: false, ready: true})
        }
    },

    login: async (credentials) => {
        set({loading: true})

        try {
            const {data} = await authService.login(credentials)
            set({
                user: data.user,
                permissions: data.permissions ?? [],
                loading: false,
            })
            return data
        } catch (err) {
            set({loading: false})
            throw err
        }
    },

    signup: async (payload) => {
        const {data} = await authService.signup(payload)
        const me = await authService.me()
        set({user: me.data.user, permissions: me.data.permissions})
        return data
    },

    guestLogin: async (name) => {
        const {data} = await authService.guest(name)
        const me = await authService.me()
        set({user: me.data.user, permissions: me.data.permissions})
        return data
    },

    googleAuth: async (credential) => {
        set({loading: true})
        try {
            const {data} = await authService.google(credential)
            const me = await authService.me()
            set({user: me.data.user, permissions: me.data.permissions, loading: false})
            return data
        } catch (err) {
            set({loading: false})
            throw err
        }
    },

    logout: async () => {
        try {
            await authService.logout()
        } catch (err: unknown) {
            if (err instanceof AppError) throw err
            const error = err as { response?: { data?: { message?: string }; status?: number } }
            throw new AppError(
                error.response?.data?.message || 'Logout failed',
                error.response?.status || 500,
                error.response?.data
            );
        }
        set({user: null, permissions: []})
    },

    // Helpers
    hasPermission: (perm) => get().permissions.includes(perm),
    isGuest: () => get().user?.role === 'guest',
    isSubscriber: () => get().user?.role === 'subscriber',
    isAdmin: () => get().user?.role === 'admin',
    isTeacher: () => get().user?.role === 'teacher',
}))