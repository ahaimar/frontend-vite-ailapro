import {type ToastBannerProps, ToastStatus, type ToastStatusType} from "./index.ts";

const TOAST_STYLES: Record<ToastStatusType, string> = {
    [ToastStatus.Success]: "bg-green-800 border-green-500/50 text-white",
    [ToastStatus.Error]:   "bg-red-800  border-rose-500/50  text-white",
    [ToastStatus.Warning]: "bg-amber-800 border-amber-500/50 text-white",
    [ToastStatus.Info]:    "bg-sky-800   border-sky-500/50   text-white",
};

const TOAST_ICONS: Record<ToastStatusType, string> = {
    [ToastStatus.Success]: "✓",
    [ToastStatus.Error]:   "✕",
    [ToastStatus.Warning]: "⚠",
    [ToastStatus.Info]:    "ℹ",
};

export function ToastBanner({ toast, onDismiss }: ToastBannerProps) {
    if (!toast) return null;

    const styles = TOAST_STYLES[toast.status];
    const icon = TOAST_ICONS[toast.status];

    const alertType = toast.status.toLowerCase();

    return (
        <div className="toast toast-top toast-center fixed z-100">
            <div
                role="status"
                aria-live="polite"
                // Combining your custom styles with the alert class if needed
                className={`
                    alert alert-${alertType}
                    flex items-center gap-2.5
                    border px-4 py-2.5 rounded-xl shadow-lg
                    text-xs font-medium pointer-events-auto
                    animate-in fade-in slide-in-from-top-2 duration-200
                    ${styles}
                `}
            >
                <span className="text-sm leading-none" aria-hidden="true">
                    {icon}
                </span>

                <span>{toast.msg}</span>

                {onDismiss && (
                    <button
                        onClick={onDismiss}
                        aria-label="Dismiss"
                        className="ml-auto opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
