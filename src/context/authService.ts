import api from '../lib/axios.ts';
import { AppError } from "./excaption/AppError.ts";
import type { Role, Status } from '../hooks/Utils.ts';

const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
    try {
        return await fn();
    } catch (err: any) {
        const data = err.response?.data;
        // Backend uses both shapes: { message } and { error } / { errors: [...] }.
        // Read all of them so the real cause surfaces instead of "Server error".
        const msg =
            data?.message ||
            data?.error ||
            (Array.isArray(data?.errors) ? data.errors.join('; ') : undefined) ||
            err.message ||
            'Server error';
        throw new AppError(msg, err.response?.status || 500, data);
    }
};

export const authService = {
    signup:  (data: any) => wrap(() => api.post('/auth/signup', data).then(r => r.data)),
    login:   (data: any) => wrap(() => api.post('/auth/login',  data).then(r => r.data)),
    guest:   (name: any) => wrap(() => api.post('/auth/guest',  { name }).then(r => r.data)),
    google:  (credential: string) => wrap(() => api.post('/auth/google', { credential }).then(r => r.data)),
    logout:  ()          => wrap(() => api.post('/auth/logout').then(r => r.data)),
    refresh: ()          => wrap(() => api.post('/auth/refresh').then(r => r.data)),
    me:      ()          => wrap(() => api.get('/auth/me').then(r => r.data)),
}

export const adminService = {

        // user manager
    getStats:           ()                                  => wrap(()      => api.get('/admin/stats').then(r => r.data)),
    listUsers:          (params?: Record<string, unknown>)  => wrap(()      => api.get('/admin/users', { params }).then(r => r.data)),
    getUser:            (id: string)                        => wrap(()      => api.get(`/admin/users/${id}`).then(r => r.data)),
    // Backend router uses PUT for these two — was PATCH, which won't match the route
    updateStatus:       (id: string, status: Status)        => wrap(()      => api.patch(`/admin/users/${id}/status`, { status }).then(r => r.data)),
    updateUser:         (id: string, data: any)             => wrap(()      => api.put(`/admin/users/${id}`, data).then(r => r.data)),
    forceLogout:        (id: string)                        => wrap(()      => api.post(`/admin/users/${id}/logout`).then(r => r.data)),
    deleteUser:         (id: string)                        => wrap(()      => api.delete(`/admin/users/${id}`).then(r => r.data)),
    getAuditLog:        (params: any)                       => wrap(()      => api.get('/admin/audit-log', { params }).then(r => r.data)),
    
    updateRole:         (id: string, role: Role)            => wrap(()      => api.patch(`/admin/users/${id}/role`, { role }).then(r => r.data)),
    adminSuspendUser: (id: string, data?: any) =>wrap(() => api.post(`/admin/users/${id}/suspend`, data).then(r => r.data)),
    adminActivateUser: (id: string, data?: any) => wrap(() => api.post(`/admin/users/${id}/activate`, data).then(r => r.data)), // Fixed URL and variable
    adminUpdateSubscription: (id: string, data: any) => wrap(() => api.post(`/admin/users/${id}/subscription`, data).then(r => r.data)), // Fixed data variable
    adminGetUserSummary: (id: string, params?: any) =>  wrap(() => api.get(`/admin/users/${id}/summary`, { params }).then(r => r.data)), // Added id to arguments

    // Write Test management
    addWriteTask:       (data?: FormData)                        => wrap(()      => api.post('/admin/write/create', data).then(r => r.data)),
    getWriteTaskById:   (testId: string)                    => wrap(()      => api.get(`/admin/write/${testId}`).then(r => r.data)),
    getWriteTask:       (params?: Record<string, unknown>)  => wrap(()      => api.get('/admin/write', { params }).then(r => r.data)),
    updateWriteTask:    (testId: string, data?: any)        => wrap(()      => api.patch(`/admin/write/${testId}`, data).then(r => r.data)),
    deleteWriteTask:    (testId: string)                    => wrap(()      => api.delete(`/admin/write/${testId}`).then(r => r.data)),

    // Read Test management
    addReadTask:        (data?: FormData)                   => wrap(() => api.post('/admin/read', data).then(r => r.data.data)),
    getReadTest:        (params?: Record<string, unknown>)  => wrap(()      => api.get('/admin/read', { params }).then(r => r.data)),
    getReadTestById:    (id: string)                        => wrap(()      => api.get(`/admin/read/${id}`).then(r => r.data)),
    updateReadTask:     (id: string, data: FormData)             => wrap(()      => api.patch(`/admin/read/${id}`, data).then(r => r.data)),
    deleteReadTask:     (id: string)                        => wrap(()      => api.delete(`/admin/read/${id}`).then(r => r.data)),

    // Listen Test management
    addListenTask:      (data: FormData)                    => wrap(()      => api.post('/admin/listen/create', data).then(r => r.data)),
    getListenTaskById:  (testId: string)                    => wrap(()      => api.get(`/admin/listen/getOne/${testId}`).then(r => r.data)),
    getListenTask:      (params?: Record<string, unknown>)  => wrap(()      => api.get('/admin/listen/getAll', { params }).then(r => r.data)),
    updateListenTask:   (testId: string, data?: any)        => wrap(()      => api.patch(`/admin/listen/update/${testId}`, data).then(r => r.data)),
    deleteListenTask:   (testId: string)                    => wrap(()      => api.delete(`/admin/listen/delete/${testId}`).then(r => r.data)),
    publishListenTask:       (id?: string)                  => wrap(()      => api.patch(`/admin/listen/${id}/publish`).then(r => r.data)),
    archiveListenTask:       (id?: string)                  => wrap(()      => api.patch(`/admin/cards/${id}/archive`).then(r => r.data)),

    // Speaking
    createSpeakTest: (data?: FormData) => wrap(() => api.post('/admin/speak/create', data).then(r => r.data.data)),
    updateSpeak:     (id: string, data: FormData) => wrap(() => api.patch(`/admin/speak/patch/${id}`, data).then(r => r.data.data)),
    getSpeakTask:       (params?: Record<string, unknown>)  => wrap(()      => api.get('/admin/speak/getAll', { params }).then(r => r.data)),
    getSpeakTaskById: (id: string) => wrap(() => api.get(`/admin/speak/get/${id}`).then(r => r.data.data)),
    deleteSpeak:        (id: string)                        => wrap(()      => api.delete(`admin/speak/delete/${id}`).then(r => r.data)),

    // card
    createCard:         (data?: any)                        => wrap(()      => api.post('/admin/cards/create', data).then(r => r.data)),
    fetchCards:         (params?: any)                      => wrap(()      => api.get('/admin/cards', params).then(r => r.data)),
    fetchCard:          (id?: string)                       => wrap(()      => api.get(`/admin/cards/${id}`).then(r => r.data)),
    updateCard:         (id: string, payload: any)          => wrap(()      => api.patch(`/admin/cards/${id}`, payload).then(r => r.data)),
    deleteCard:         (id?: string)                       => wrap(()      => api.delete(`/admin/cards/${id}`).then(r => r.data)),
    publishCard:        (id?: string)                       => wrap(()      => api.patch(`/admin/cards/${id}/publish`).then(r => r.data)),
    archiveCard:        (id?: string)                       => wrap(()      => api.patch(`/admin/cards/${id}/archive`).then(r => r.data)),
};

export const testService = {
    list: ()            => wrap(() => api.get('/tests').then(r => r.data)),
    attempt: (id: any)  => wrap(() => api.post(`/tests/${id}/attempt`).then(r => r.data)),
}

export const userService = {

    /** get user by id  */
    getUser: () => wrap(() => api.get("/users/get").then(r => r.data)),
    getUserBySub: () => wrap(() => api.get("/users/get/sub").then(r => r.data)),

    /* ─────────────────────────────────────────────
       User SubScription
    ───────────────────────────────────────────── */
    createOrder:(data?: any) => wrap(() => api.post("/payments/create-order", data).then(r => r.data)),
    captureOrder:(data?: any) => wrap(() => api.post("/payments/capture-order", data).then(r => r.data)),

    /**
     * Manually subscribe or renew a user's subscription
     * @param id - The target user's ID
     * @param payload - { plan: 'free' | 'basic' | 'pro' | 'unlimited', daysFromNow?: number }
     */
    subscribeUser: ( payload: { plan: string; daysFromNow?: any }) => 
        wrap(() => api.post(`/payments/users/subscribe`, payload).then(r => r.data)),

    /**
     * Start or extend a user's trial period
     * @param id - The target user's ID
     * @param payload - { trialDays: number }
     */
    startUserTrial: (id: string, payload: { trialDays: number }) => 
        wrap(() => api.post(`/payments/users/${id}/start-trial`, payload).then(r => r.data)),

    PAYPAL_CLIENT_ID: () => wrap(() => api.get(`/payments/client-id`).then(r => r.data)),
    GOOGLE_CLIENT_ID: () => wrap(() => api.get(`/users/client-id`).then(r => r.data)),

    /**
     * Reset attempt counters for a specific user
     * @param id - The target user's ID
     * @param payload - { type: 'daily' | 'total' | 'both' }
     */
    resetUserAttempts: (id: string, payload: { type: 'daily' | 'total' | 'both' }) => 
        wrap(() => api.post(`/payments/users/${id}/reset-attempts`, payload).then(r => r.data)),

    /* ─────────────────────────────────────────────
       User Profile & Stats
    ───────────────────────────────────────────── */
    getMyStats: ()              => wrap(() => api.get(`/users/me/stats`).then(r => r.data)),
    getMe: ()                   => wrap(() => api.get(`/users/me`).then(r => r.data)),

    getProfile: (id: any)       => wrap(() => api.get(`/users/${id}/profile`).then(r => r.data)),

    /* ─────────────────────────────────────────────
       Profile Updates
    ───────────────────────────────────────────── */
    updateProfile:         (d: any)                            => wrap(() => api.patch(`/users/profile`, d).then(r => r.data)),
    updateEmail:           (d: any)                            => wrap(() => api.patch(`/users/email`, d).then(r => r.data)),
    updateDailyUsed: (newDailyAttemptsUsed: number)            => wrap(() => api.patch(`/users/daily`, { newDailyAttemptsUsed }).then(r => r.data)),
    changePassword:        (d: any)                            => wrap(() => api.patch(`/users/password`, d).then(r => r.data)),
 
    /** */

    // Write Test management
    getWriteTaskById:   (testId: string)                    => wrap(()      => api.get(`/users/write/${testId}`).then(r => r.data)),
    getWriteTask:       (params?: Record<string, unknown>)  => wrap(()      => api.get('/users/write', { params }).then(r => r.data)),

    // Read Test management 
    addReadTask:        (data?: any)                        => wrap(()      => api.post('/users/read', data).then(r => r.data)),
    getReadTest:        (params?: Record<string, unknown>)  => wrap(()      => api.get('/users/read', { params }).then(r => r.data)),
    getReadTestById:    (id: string)                        => wrap(()      => api.get(`/users/read/${id}`).then(r => r.data)),

    // Listen
    getListenTaskById:  (testId: string)                    => wrap(()      => api.get(`/users/listen/getOne/${testId}`).then(r => r.data)),
    getListenTask:      (params?: Record<string, unknown>)  => wrap(()      => api.get('/users/listen/getAll', { params }).then(r => r.data)),

    // speaking
    getSpeakTask:       (params?: Record<string, unknown>)  => wrap(()      => api.get('/users/speak/getAll', { params }).then(r => r.data)),
    getSpeakTaskById:   (id: string)                        => wrap(()      => api.get(`/users/speak/get/${id}`).then(r => r.data)),

    /**
     * Session Prop
     */
    CreateSession:      (data?: any)                        => wrap(()      => api.post("/users/create/new_correction", data).then(r => r.data)),
    getAllSessions:     (page?: any)                        => wrap(()      => api.get(`/users/get/all_correction`, { params: { page, limit: 10 } }).then(r => r.data)),
    getTestCorrection:     (testRef: any, page?: any)       => wrap(()      => api.get(`/users/get/test_correction/by_ref/${testRef}`, { params: { page, limit: 1 } }).then(r => r.data)),

    /**
     * Cards Tasks
     */
    fetchCards:         (params?: any)                      => wrap(()      => api.get('/users/cards', params).then(r => r.data)),
    fetchCard:          (id?: string)                       => wrap(()      => api.get(`/users/cards/${id}`).then(r => r.data)),

    /**
     * Exam Management
     */
    creatExam:          (data?: any)                        => wrap(()      => api.post('/users/exam/creat', data).then(r => r.data)),
    getExamById:        (id?: string)                       => wrap(()      => api.get(`/users/exam/${id}`).then(r => r.data)),
    getExam:            (params?: any)                      => wrap(()      => api.get('/users/exam', params).then(r => r.data)),
    updateExam:         (id: string, payload: any)          => wrap(()      => api.patch(`/users/exam/${id}`, payload).then(r => r.data)),
    
    /**
     * Complete a module within an exam (Writing, Reading, Listening, Speaking)
     * Call this after submitting answers to link the TestCorrection to the exam
     */
    completeExamModule: (examId: string, module: "writing" | "reading" | "listening" | "speaking", payload: {
        testRef: string;
        testModelRef: string;
        testData: any;
        score?: number | null;
    }) => wrap(() => api.post(`/users/exam/${examId}/complete/${module}`, payload).then(r => r.data)),

    /**
     * Speaking Test 
     */
    getSpeakTestById:   (id: string)                        => wrap(()      => api.get(`/users/speak/get/${id}`).then(r => r.data)),
};