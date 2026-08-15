import {useState} from "react";
import {useNavigate} from "react-router";
import {useAuthStore} from "../context/authStore";
import {
    AudioLines, BookOpenText, Eye, EyeOff,
    LockKeyhole, Mic, PenLine, Timer,
} from "lucide-react";
import * as React from "react";
import axios from "axios";
import {useToast} from "../ui";
import {ToastBanner} from "../ui/Toest.tsx";
import {Button, Input, Field, Label } from "../ui/UI.tsx";
import GoogleSignInButton from "../components/auth/GoogleSignInButton.tsx";
import ImageMenu from "../assets/LOGO_page-0003.jpg";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "login" | "signup" | "guest";

type FormState = {
    name: string;
    email: string;
    password: string;
    guestName: string;
};

// ─── AuthPage ─────────────────────────────────────────────────────────────────

const TABS: Tab[] = ["login", "signup", "guest"];

const TAB_LABELS: Record<Tab, string> = {
    login: "Sign In",
    signup: "Create Account",
    guest: "Try as Guest",
};

const MODULES = [
    {icon: <AudioLines size={16}/>, name: "Listening", color: "blue"},
    {icon: <BookOpenText size={16}/>, name: "Reading", color: "green"},
    {icon: <PenLine size={16}/>, name: "Writing", color: "gold"},
    {icon: <Mic size={16}/>, name: "Speaking", color: "purple"},
];

const STRENGTH_COLORS = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-400"];
const STRENGTH_LABELS = ["Too weak", "Weak", "Good", "Strong"];

export default function AuthPage({tab: initialTab = "login"}: { tab?: Tab }) {
    const [tab, setTab] = useState<Tab>(initialTab);
    const [showPw, setShowPw] = useState(false);
    const [strength, setStrength] = useState(0);
    const [loading, setLoading] = useState(false);

    const {user} = useAuthStore();
    const {toast, show: showToast} = useToast();
    const {login, signup, guestLogin, googleAuth} = useAuthStore();
    const navigate = useNavigate();

    const [form, setForm] = useState<FormState>({
        name: "",
        email: "",
        password: "",
        guestName: "",
    });

    const set = (k: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            setForm((f) => ({...f, [k]: e.target.value}));
            if (k === "password") {
                const v = e.target.value;
                let s = 0;
                if (v.length >= 8) s++;
                if (/[A-Z]/.test(v)) s++;
                if (/[0-9]/.test(v)) s++;
                if (/[^A-Za-z0-9]/.test(v)) s++;
                setStrength(s);
            }
        };

    const switchTab = (t: Tab) => {
        setTab(t);
        setShowPw(false);
    };

    // Correct type: React.FormEvent<HTMLFormElement>
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (tab === "login") {
                await login({email: form.email, password: form.password});
                showToast("Welcome back!", "INFO");
                navigate(!user?.is_subscription ? "/choose" : "/dashboard");
            } else if (tab === "signup") {
                await signup({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                });
                showToast("Account created!", "INFO");
                navigate(!user?.is_subscription ? "/choose" : "/dashboard");
            } else {
                await guestLogin(form.guestName || "Guest");
                showToast("Guest session started (48h)", "SUCCESS");
                navigate("/dashboard");
            }
        } catch (err: unknown) {
            // The store throws an AppError whose `.data` carries the server body
            // ({ error, errors }). Axios errors expose the same under response.data.
            const body =
                (err as { data?: { error?: string; errors?: string[] } })?.data ??
                (axios.isAxiosError(err) ? err.response?.data : undefined);

            const msg =
                body?.errors?.[0] ??
                body?.error ??
                (err instanceof Error ? err.message : undefined) ??
                "Something went wrong.";

            showToast(msg, "ERROR");
        } finally {
            setLoading(false);
        }
    };

    // Google Identity Services hands us a signed ID token (credential); pass it
    // to the backend, which verifies it and creates/links the account.
    const handleGoogle = async (credential: string) => {
        setLoading(true);
        try {
            await googleAuth(credential);
            showToast("Signed in with Google!", "SUCCESS");
            navigate(user?.is_subscription === true && user?.subscription !== 'free' ? "/choose" : "/dashboard");
        } catch (err: unknown) {
            const body =
                (err as { data?: { error?: string; errors?: string[] } })?.data ??
                (axios.isAxiosError(err) ? err.response?.data : undefined);
            const msg =
                body?.errors?.[0] ??
                body?.error ??
                (err instanceof Error ? err.message : undefined) ??
                "Google sign-in failed.";
            showToast(msg, "ERROR");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-bg flex">
            <ToastBanner toast={toast}/>
            {/* ── Left panel ────────────────────────────────────────────────────── */}
            <div
                className="hidden lg:flex w-120 shrink-0 flex-col justify-between bg-linear-to-b from-indigo-600 to-slate-950/90 border-r border-white/6 px-12 py-12 relative overflow-hidden text-white/95">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-gold to-blue"/>
                <div
                    className="absolute -top-2.5 -right-20 w-100 h-100 rounded-full bg-blue/[0.04] blur-[80px] pointer-events-none"/>

                {/* Brand */}
                <div className="flex items-center gap-4">
                    <div className="rounded-[13px] bg-linear-to-br from-gold to-gold2 flex items-center
                        justify-center font-syne font-bold text-lg text-bg shadow-lg shadow-gold/20"
                    >
                        <img src={ImageMenu} className="rounded-3xl lg:w-20 object-cover shadow-2xl" alt="aila icon" />
                    </div>
                    <div>
                        <div className="font-syne font-bold text-lg ">AILA IELTS Pro</div>
                        <div className="text-[11px] tracking-widest uppercase mt-0.5">
                            aila pro International Language English Academy
                        </div>
                    </div>
                </div>

                {/* Hero */}
                <div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-7 h-[1.5px] bg-gold"/>
                        <span
                            className="font-mono text-[11px] tracking-[3px] text-gold uppercase">CBT Exam Simulator</span>
                    </div>
                    <h1 className="font-syne font-extrabold text-[46px] leading-[1.08] tracking-tight mb-5">
                        Train Like<br/>It's <span className="text-gold">Real.</span><br/>Score Like<br/>It Counts.
                    </h1>
                    <p className="text-[15px] leading-[1.75] mb-10 max-w-sm">
                        Pixel-accurate Inspera CBT environment. All 4 modules. Real exam rules. Real timer. Real
                        pressure.
                    </p>

                    <div className="flex gap-8 mb-10">
                        {[["20+", "Mock Tests"], ["4", "Modules"], ["9.0", "Max Band"]].map(([n, l]) => (
                            <div key={l}>
                                <div className="font-syne font-extrabold text-3xl tracking-tighter ">{n}</div>
                                <div className="text-[11px] uppercase tracking-wider mt-1">{l}</div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {MODULES.map(({icon, name}) => (
                            <div key={name}
                                 className="flex items-center gap-2.5 bg-surface/60 border border-white/06 rounded-xl px-4 py-3 hover:border-blue/25 transition-all">
                                <span className="">{icon}</span>
                                <span className="text-[13px] font-medium ">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="text-[12px] flex items-center gap-2 pt-2">
                    <LockKeyhole size={12}/>
                    <span>256-bit SSL encrypted</span>
                </div>
            </div>

            {/* ── Right panel ────────────────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-6 py-10 bg-linear-to-r from-indigo-600 via-purple-700 to-pink-950">
                <div className="w-full max-w-xl">
                    <div className="bg-slate-950/90 border border-slate-700 rounded-box w-full p-4 sm:px-8 sm:py-10 shadow-lg shadow-slate-900/50">
                        {/* Tabs */}
                        <div className="flex bg-surface rounded-xl p-1 mb-8 justify-center gap-2">
                            {TABS.map((t) => (
                                <Button
                                    key={t}
                                    variant={"ghost"}
                                    onClick={() => switchTab(t)}
                                >
                                    {TAB_LABELS[t]}
                                </Button>
                            ))}
                        </div>

                        <form onSubmit={handleSubmit} noValidate>

                            {/* ── LOGIN ── */}
                            {tab === "login" && (
                                <>
                                    <div className="mb-6">
                                        <Label>
                                            <h2 className="font-syne font-extrabold text-white text-[26px] tracking-tight">Welcome back</h2>
                                        </Label>
                                        <Label>Continue your IELTS preparation.</Label>
                                    </div>
                                    <Field label="Email Address" htmlFor="email" required hint="Email is Required">
                                        <Input type="email" placeholder="you@example.com"
                                               value={form.email} onChange={set("email")} required autoComplete="email"
                                        />
                                    </Field>
                                    <div className="relative">
                                        <Field label="Password" htmlFor="password" required>
                                            <Input type={showPw ? "text" : "password"}
                                                   placeholder="Your password"
                                                   value={form.password} onChange={set("password")} required
                                                   autoComplete="current-password"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-11 text-white/50 hover:text-white/80 transition-colors"
                                                aria-label={showPw ? "Hide password" : "Show password"}
                                            >
                                                {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                                            </button>
                                        </Field>
                                    </div>
                                </>
                            )}

                            {/* ── SIGNUP ── */}
                            {tab === "signup" && (
                                <>
                                    <div className="mb-6">
                                        <Label>
                                            <h2 className="font-syne font-extrabold text-white text-[26px] tracking-tight">Start training today</h2>
                                        </Label>
                                        <Label>Join thousands preparing for IELTS with AILA.</Label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <Field label="Full Name" htmlFor="name" required>
                                            <Input type="text" placeholder="Your name"
                                                   value={form.name} onChange={set("name")} required autoComplete="name"/>
                                        </Field>
                                        <Field label="Email Address" htmlFor="email" required>
                                            <Input type="email" placeholder="you@example.com"
                                                   value={form.email} onChange={set("email")} required autoComplete="email"/>
                                        </Field>
                                    </div>
                                    <div className="relative">
                                        <Field label="Password" htmlFor="password" required>
                                            <Input type={showPw ? "text" : "password"}
                                                   placeholder="Min 8 chars · A-Z + 0-9"
                                                   value={form.password} onChange={set("password")} required
                                                   autoComplete="new-password"
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPw((v) => !v)}
                                                className="absolute right-3 top-11 text-white/50 hover:text-white/80 transition-colors"
                                                aria-label={showPw ? "Hide password" : "Show password"}
                                            >
                                                {showPw ? <EyeOff size={18}/> : <Eye size={18}/>}
                                            </button>
                                        </Field>
                                    </div>

                                    {/* Password strength */}
                                    {form.password && (
                                        <div className="-mt-2 mb-4">
                                            <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-1">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${STRENGTH_COLORS[strength - 1] ?? "bg-white/10"}`}
                                                    style={{width: `${(strength / 4) * 100}%`}}
                                                />
                                            </div>
                                            <span className="text-[11px] text-white/30">
                                                {STRENGTH_LABELS[strength - 1] ?? "Start typing"}
                                            </span>
                                        </div>
                                    )}

                                </>
                            )}

                            {/* ── GUEST ── */}
                            {tab === "guest" && (
                                <>
                                    <div className="mb-6">
                                        <Label>
                                            <h2 className="font-syne font-extrabold text-[26px] tracking-tight text-white">Try AILA Free</h2>
                                        </Label>
                                        <Label>No account needed — 48 hours of access.</Label>
                                    </div>
                                    <div
                                        className="bg-gold/[0.07] border border-gold/20 rounded-xl p-4 mb-5 flex gap-3 items-start">
                                        <Timer size={20} className="text-gold shrink-0 mt-0.5"/>
                                        <div>
                                            <Label>
                                                <p className="text-gold font-semibold text-sm">48-Hour Guest Access</p>
                                            </Label>
                                            <Label>
                                                <p className="text-white text-[13px] mt-1">
                                                    Free mock tests only. Upgrade anytime to unlock all 20+ tests, AI writing
                                                    feedback, and speaking simulation.
                                                </p>
                                            </Label>
                                        </div>
                                    </div>
                                    <Field label="Guest Name" htmlFor="guestName">
                                        <Input type="text" placeholder="e.g. Kofi"
                                               value={form.guestName} onChange={set("guestName")} autoComplete="off"/>
                                    </Field>

                                </>
                            )}

                            <div className="grid grid-cols-1 gap-4">
                                {/* Submit */}
                                <Button
                                    size="sm"
                                    loading={loading}
                                >
                                    {loading ? (
                                        <span className="loading loading-dots loading-md"/>
                                    ) : tab === "login" ? (
                                        "Sign In to AILA"
                                    ) : tab === "signup" ? (
                                        "Create Your Account"
                                    ) : (
                                        "Start Guest Session →"
                                    )}
                                </Button>
                                {/* ── Google sign-in (login & signup tabs only) ── */}
                                {tab !== "guest" && (
                                    <>
                                        <div className="flex items-center gap-3 my-1">
                                            <div className="h-px flex-1 bg-white/10"/>
                                            <span className="text-[11px] uppercase tracking-wider text-white/25">or</span>
                                            <div className="h-px flex-1 bg-white/10"/>
                                        </div>
                                        <GoogleSignInButton
                                            onCredential={handleGoogle}
                                            text={tab === "signup" ? "signup_with" : "signin_with"}
                                        />
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}