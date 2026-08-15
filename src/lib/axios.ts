import axios from 'axios';

// Vite exposes the mode via import.meta.env.PROD / DEV — NOT NODE_ENV
// (which is always undefined here). The old check fell through to the dev URL
// in every build, so a production deploy would call localhost.
const BASE_URL = import.meta.env.PROD
  ? "/api"
  : "http://localhost:9032/api";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,          // auth rides on HttpOnly cookies, set/sent automatically
});

let isRefreshing = false
type QueueItem = {
    resolve: (value?: unknown) => void
    reject:  (reason?: unknown) => void
}
let failedQueue: QueueItem[] = []

const processQueue = (error: unknown) => {
    failedQueue.forEach(p => error ? p.reject(error) : p.resolve())
    failedQueue = []
}

// ── Request interceptor — attach current token + handle FormData ─────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type']; // let browser set it with boundary
    }

    return config;
});

// ── Response interceptor — auto-refresh on 401 TOKEN_EXPIRED ─────────────────
api.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config
        const isExpired = err.response?.status === 401 && err.response?.data?.code === 'TOKEN_EXPIRED'

        if (isExpired && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(() => api(original)).catch(e => Promise.reject(e))
            }

            original._retry = true
            isRefreshing = true

            try {
                await api.post('/auth/refresh')
                processQueue(null)
                console.log('Session refreshed.')
                return api(original)
            } catch (refreshErr: unknown) {
                processQueue(refreshErr)
                console.log('Session expired. Please log in again.', false)
                window.location.href = '/login'
                return Promise.reject(refreshErr)
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(err)
    }
)

export default api