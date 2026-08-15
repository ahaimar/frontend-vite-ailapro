import {useCallback, useEffect, useRef, useState} from "react";

export function useToast_2(durationMs = 3000) {
    const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

    const show = useCallback((msg: string, ok: boolean) => {
        setToast({msg, ok});
        setTimeout(() => setToast(null), durationMs);
    }, [durationMs]);

    return {toast, show};
}

type Stat = 'error' | 'success' | 'warning' | 'message' | 'info';

export function useMessage(durationMs = 3000) {
    const [toast, setToast] = useState<{ msg: string; stat: Stat } | null>(null);
    const show = useCallback((msg: string, stat: Stat) => {
        setToast({msg, stat});
        setTimeout(() => setToast(null), durationMs);
    }, [durationMs]);

    return {toast, show};
}


export const ToastStatus = {
    Success: "SUCCESS",
    Error:   "ERROR",
    Warning: "WARNING",
    Info:    "INFO",
} as const;

export interface ToastBannerProps {
    toast:    ToastData | null;
    onDismiss?: () => void;
}

export type ToastStatusType = typeof ToastStatus[keyof typeof ToastStatus];

export interface ToastData {
    msg:    string;
    status: ToastStatusType;
}

export function useToast(durationMs = 3000) {
    const [toast, setToast] = useState<ToastData | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const dismiss = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast(null);
    }, []);

    const show = useCallback((msg: string, status: ToastStatusType) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToast({ msg, status });
        timerRef.current = setTimeout(() => setToast(null), durationMs);
    }, [durationMs]);

    const success = useCallback((msg: string) => show(msg, ToastStatus.Success), [show]);
    const error   = useCallback((msg: string) => show(msg, ToastStatus.Error),   [show]);
    const warning = useCallback((msg: string) => show(msg, ToastStatus.Warning), [show]);
    const info    = useCallback((msg: string) => show(msg, ToastStatus.Info),    [show]);

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

    return { toast, show, dismiss, success, error, warning, info };
}

