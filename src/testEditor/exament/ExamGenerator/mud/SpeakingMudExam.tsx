/* eslint-disable react-hooks/refs */
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
    CheckCircle2, AlertCircle, ArrowRight,
    Mic, Play, Square, Volume2, MicOff,
    ChevronRight, Loader2,
} from "lucide-react";
import type { Parts, SpeakTest } from "../../../spikingTask/speak";
import { useToast } from "../../../../ui";
import { userService } from "../../../../context/authService";
import type { TestData } from "../../../SessionDTO";
import { ToastBanner } from "../../../../ui/Toest";
import { Button } from "../../../../ui/UI";
import HeaderForm from "../Index";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Recording {
    blob: Blob;
    url:  string;   // object URL — revoked on replacement or unmount
    size: number;
}

type PartState = "idle" | "playing_prompt" | "prep" | "recording" | "done";


const PREP_TIME: Record<Parts["speakType"], number> = {
    interview:  0,
    cue_card:   10,
    discussion: 0,
};

const MAX_RECORD_TIME: Record<Parts["speakType"], number> = {
    interview:   90,
    cue_card:   120,
    discussion:  90,
};

const SPEAK_TYPE_LABEL: Record<Parts["speakType"], string> = {
    interview:  "Part 1 — Interview",
    cue_card:   "Part 2 — Long Turn",
    discussion: "Part 3 — Discussion",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatTime = (s: number): string => {
    const m   = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
};

const formatBytes = (b: number): string =>
    b < 1024 * 1024
        ? `${(b / 1024).toFixed(0)} KB`
        : `${(b / 1024 / 1024).toFixed(1)} MB`;

// ─── Timer ────────────────────────────────────────────────────────────────────

// ─── Volume visualiser ────────────────────────────────────────────────────────

const VolumeBar: React.FC<{ active: boolean; analyser: AnalyserNode | null }> = ({
                                                                                     active, analyser,
                                                                                 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rafRef    = useRef<number>(0);

    useEffect(() => {
        if (!active || !analyser || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d")!;
        const data   = new Uint8Array(analyser.frequencyBinCount);

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(data);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const bars = 20;
            const bw   = canvas.width / bars - 2;
            const avg  = Array.from(data.slice(0, bars)).map(v => v / 255);
            avg.forEach((v, i) => {
                const h = Math.max(4, v * canvas.height);
                ctx.fillStyle = `rgba(220, 38, 38, ${0.4 + v * 0.6})`;
                ctx.beginPath();
                ctx.roundRect(i * (bw + 2), (canvas.height - h) / 2, bw, h, 2);
                ctx.fill();
            });
        };
        draw();
        return () => cancelAnimationFrame(rafRef.current);
    }, [active, analyser]);

    if (!active) return null;
    return <canvas ref={canvasRef} width={180} height={40} className="rounded-lg opacity-80" />;
};

// ─── Prompt player hook ───────────────────────────────────────────────────────

function usePromptPlayer() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [playing, setPlaying] = useState(false);

    const stop = useCallback(() => {
        audioRef.current?.pause();
        audioRef.current = null;
        window.speechSynthesis.cancel();
        utterRef.current = null;
        setPlaying(false);
    }, []);

    const play = useCallback((part: Parts) => {
        stop();
        setPlaying(true);
        if (part.audio_url) {
            const audio    = new Audio(part.audio_url);
            audio.onended  = () => setPlaying(false);
            audio.onerror  = () => setPlaying(false);
            audioRef.current = audio;
            audio.play();
        } else {
            const u  = new SpeechSynthesisUtterance(part.textBody);
            u.rate   = 0.88;
            u.pitch  = 1;
            u.lang   = "en-GB";
            u.onend  = () => setPlaying(false);
            u.onerror = () => setPlaying(false);
            utterRef.current = u;
            window.speechSynthesis.speak(u);
        }
    }, [stop]);

    useEffect(() => () => stop(), [stop]);

    return { play, stop, playing };
}

// ─── Recorder hook ────────────────────────────────────────────────────────────

function useRecorder() {
    const mediaRef    = useRef<MediaRecorder | null>(null);
    const chunksRef   = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const streamRef   = useRef<MediaStream | null>(null);

    const [recording, setRecording] = useState(false);
    const [micError,  setMicError ] = useState<string | null>(null);

    const startRecording = useCallback(async (): Promise<void> => {
        setMicError(null);
        chunksRef.current = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const ctx      = new AudioContext();
            const src      = ctx.createMediaStreamSource(stream);
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            src.connect(analyser);
            analyserRef.current = analyser;
            const mr = new MediaRecorder(stream);
            mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mr.start(100);
            mediaRef.current = mr;
            setRecording(true);
        } catch (err) {
            setMicError(
                (err as Error).name === "NotAllowedError"
                    ? "Microphone access denied. Please allow mic access in your browser settings."
                    : "Could not start recording: " + (err as Error).message,
            );
        }
    }, []);

    const stopRecording = useCallback((): Promise<Recording> =>
            new Promise(resolve => {
                const mr = mediaRef.current;
                if (!mr) { resolve({ blob: new Blob(), url: "", size: 0 }); return; }
                mr.onstop = () => {
                    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
                    const url  = URL.createObjectURL(blob);
                    streamRef.current?.getTracks().forEach(t => t.stop());
                    analyserRef.current = null;
                    mediaRef.current    = null;
                    setRecording(false);
                    resolve({ blob, url, size: blob.size });
                };
                mr.stop();
            }),
        []);

    useEffect(() => () => {
        mediaRef.current?.stop();
        streamRef.current?.getTracks().forEach(t => t.stop());
    }, []);

    return { startRecording, stopRecording, recording, micError, analyserRef };
}

// ─── Recording playback ───────────────────────────────────────────────────────

const RecordingPlayback: React.FC<{ recording: Recording }> = ({ recording }) => {
    const [playing, setPlaying] = useState(false);
    // FIX: was creating a new Audio on every play click without pausing/releasing the old one.
    // Storing in a ref so the same instance is paused before a new one is created.
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const toggle = useCallback(() => {
        if (playing) {
            audioRef.current?.pause();
            audioRef.current = null;
            setPlaying(false);
        } else {
            // Discard any lingering instance first
            audioRef.current?.pause();
            const a = new Audio(recording.url);
            a.onended = () => setPlaying(false);
            audioRef.current = a;
            a.play();
            setPlaying(true);
        }
    }, [playing, recording.url]);

    // Stop on unmount
    useEffect(() => () => { audioRef.current?.pause(); }, []);

    return (
        <div className="flex items-center gap-3 bg-lime-950/30 border border-lime-800/30 rounded-xl px-4 py-2.5">
            <button
                onClick={toggle}
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    playing ? "bg-rose-600 text-white" : "bg-lime-600 text-white hover:bg-lime-500"
                }`}
            >
                {playing ? <Square size={10} /> : <Play size={10} />}
            </button>
            <span className="text-xs text-lime-400/80 font-medium">
                {playing ? "Playing…" : "Review your answer"}
            </span>
            <span className="ml-auto text-[10px] text-base-content/30">{formatBytes(recording.size)}</span>
        </div>
    );
};

// ─── Part card ────────────────────────────────────────────────────────────────

interface PartCardProps {
    part:         Parts;
    partIndex:    number;
    partState:    PartState;
    recording:    Recording | null;
    prepTimeLeft: number;
    recTimeLeft:  number;
    analyserRef:  React.RefObject<AnalyserNode | null>;
    isRecording:  boolean;
    promptPlayer: ReturnType<typeof usePromptPlayer>;
    onStart:      () => void;
    onStopEarly:  () => void;
    isActive:     boolean;
    isComplete:   boolean;
}

const PartCard: React.FC<PartCardProps> = ({
                                               part, partIndex, partState, recording, prepTimeLeft, recTimeLeft,
                                               analyserRef, isRecording, promptPlayer, onStart, onStopEarly, isActive, isComplete,
                                           }) => {
    const typeLabel = SPEAK_TYPE_LABEL[part.speakType];
    const prepTime  = PREP_TIME[part.speakType];
    const maxRec    = MAX_RECORD_TIME[part.speakType];

    return (
        <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            isActive
                ? "border-indigo-600/60 shadow-lg shadow-indigo-950/30"
                : isComplete
                    ? "border-lime-800/40 bg-lime-950/10"
                    : "border-base-300 opacity-50"
        }`}>
            <div className={`flex items-center justify-between px-5 py-3 border-b ${
                isActive   ? "bg-indigo-950/30 border-indigo-800/40" :
                    isComplete ? "bg-lime-950/20 border-lime-800/30"     :
                        "bg-base-200 border-base-300"
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                        isComplete ? "bg-lime-600 text-white" :
                            isActive   ? "bg-indigo-600 text-white" :
                                "bg-base-300 text-base-content/40"
                    }`}>
                        {isComplete ? <CheckCircle2 size={14} /> : partIndex + 1}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-base-content/40 uppercase tracking-widest">
                            {typeLabel}
                        </p>
                        {part.speakType === "cue_card" && (
                            <p className="text-[10px] text-indigo-400/70 mt-0.5">
                                {prepTime}s prep · {maxRec}s response
                            </p>
                        )}
                    </div>
                </div>

                {isComplete && recording && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-lime-400
                                     bg-lime-900/30 border border-lime-800/40 rounded-full px-2.5 py-1">
                        <CheckCircle2 size={10} /> Recorded · {formatBytes(recording.size)}
                    </span>
                )}
                {isActive && partState === "recording" && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400
                                     bg-red-900/20 border border-red-800/30 rounded-full px-2.5 py-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        REC {formatTime(recTimeLeft)}
                    </span>
                )}
                {isActive && partState === "prep" && (
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400
                                     bg-amber-900/20 border border-amber-800/30 rounded-full px-2.5 py-1">
                        Prep {formatTime(prepTimeLeft)}
                    </span>
                )}
            </div>

            <div className="px-5 py-4 space-y-4">
                <p className="text-sm text-base-content leading-relaxed whitespace-pre-line">
                    {part.textBody || <span className="text-base-content/30 italic">No prompt text.</span>}
                </p>

                {isActive && (
                    <div className="flex items-center gap-3 flex-wrap pt-1">
                        {(partState === "idle" || partState === "playing_prompt") && (
                            <button
                                onClick={partState === "playing_prompt"
                                    ? promptPlayer.stop
                                    : () => promptPlayer.play(part)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold
                                           border transition-all ${
                                    partState === "playing_prompt"
                                        ? "bg-amber-900/20 border-amber-700/40 text-amber-400"
                                        : "bg-base-200 border-base-300 text-base-content/60 hover:border-indigo-500/40 hover:text-indigo-400"
                                }`}
                            >
                                {partState === "playing_prompt"
                                    ? <><Square size={11} /> Stop</>
                                    : <><Volume2 size={11} /> Listen to prompt</>
                                }
                            </button>
                        )}

                        {partState === "idle" && (
                            <button
                                onClick={onStart}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                                           bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50
                                           transition-all active:scale-95"
                            >
                                {prepTime > 0
                                    ? <><ChevronRight size={11} /> Begin (prepare {prepTime}s)</>
                                    : <><Mic size={11} /> Start recording</>
                                }
                            </button>
                        )}

                        {partState === "prep" && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                                            bg-amber-900/20 border border-amber-700/30 text-amber-400">
                                <Loader2 size={11} className="animate-spin" />
                                Preparing… recording starts in {prepTimeLeft}s
                            </div>
                        )}

                        {partState === "recording" && (
                            <>
                                <VolumeBar active={isRecording} analyser={analyserRef?.current} />
                                <button
                                    onClick={onStopEarly}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold
                                               bg-red-900/30 border border-red-700/40 text-red-400
                                               hover:bg-red-900/50 transition-all active:scale-95"
                                >
                                    <Square size={11} /> Finish early
                                </button>
                            </>
                        )}

                        {partState === "playing_prompt" && (
                            <p className="text-[11px] text-base-content/40 italic">
                                Listening — recording will start automatically…
                            </p>
                        )}
                    </div>
                )}

                {isComplete && recording && (
                    <RecordingPlayback recording={recording} />
                )}
            </div>
        </div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const SpeakingMudExam: React.FC = () => {
    //const {user} = useAuthStore();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [test,        setTest      ] = useState<SpeakTest | null>(null);
    const [timeLeft,    setTimeLeft  ] = useState(15 * 60);
    const [submitting,  setSubmitting] = useState(false);
    const [submitted,   setSubmitted ] = useState(false);
    const [loading,     setLoading   ] = useState(true);
    const [error,       setError     ] = useState<string | null>(null);

    const [currentPart, setCurrentPart] = useState(0);
    const [partStates,  setPartStates  ] = useState<PartState[]>([]);
    const [recordings,  setRecordings  ] = useState<(Recording | null)[]>([]);
    const [prepLeft,    setPrepLeft    ] = useState(0);
    const [recLeft,     setRecLeft     ] = useState(0);

    const { toast, show: showToast } = useToast();
    const promptPlayer = usePromptPlayer();
    const recorder     = useRecorder();
    const prepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const recTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

    // Keep a ref to test.parts so beginRecording doesn't capture a stale closure
    // FIX: beginRecording was reading test!.parts[partIdx].speakType from closure state —
    // if test updated after mount the ref could be stale. Ref always mirrors current state.
    const testPartsRef = useRef<SpeakTest["parts"]>([]);

    // ── Fetch ─────────────────────────────────────────────────────────────────

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        userService.getSpeakTestById(id)
            .then((res: { success: boolean; data: SpeakTest; message?: string }) => {
                if (!res.success) throw new Error(res.message ?? "Test not found");
                const data = res.data;
                setTest(data);
                testPartsRef.current = data.parts;
                setTimeLeft((data.metadata?.estimatedDuration ?? 15) * 60);
                setPartStates(Array<PartState>(data.parts.length).fill("idle"));
                setRecordings(Array(data.parts.length).fill(null));
            })
            .catch((err: unknown) => {
                const msg =
                    (err as { response?: { data?: { message?: string } } })
                        ?.response?.data?.message ??
                    (err as Error)?.message ??
                    "Failed to load test";
                setError(msg);
                showToast(msg, "ERROR");
            })
            .finally(() => setLoading(false));
    }, [id, showToast]);

    // ── Global timer ──────────────────────────────────────────────────────────

    useEffect(() => {
        if (submitted) return;
        const iv = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(iv);
                    showToast("Time's up — auto-submitting.", "WARNING");
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(iv);
    }, [submitted, showToast]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────

    useEffect(() => () => {
        if (prepTimerRef.current) clearInterval(prepTimerRef.current);
        if (recTimerRef.current)  clearInterval(recTimerRef.current);
        // Revoke all object URLs to release memory
        setRecordings(prev => {
            prev.forEach(r => { if (r?.url) URL.revokeObjectURL(r.url); });
            return prev;
        });
    }, []);

    // ── Helpers ───────────────────────────────────────────────────────────────

    const setPart = useCallback((i: number, state: PartState) =>
            setPartStates(prev => prev.map((s, idx) => idx === i ? state : s)),
        []);

    // FIX: revoke the old URL before overwriting the slot so there's no leak
    // when a user re-records a part (stops early then starts again)
    const setRecording = useCallback((i: number, rec: Recording) => {
        setRecordings(prev => {
            const old = prev[i];
            if (old?.url) URL.revokeObjectURL(old.url);
            return prev.map((r, idx) => idx === i ? rec : r);
        });
    }, []);

    // ── Part flow ─────────────────────────────────────────────────────────────

    const beginRecording = useCallback(async (partIdx: number) => {
        // FIX: clear any previous rec timer before starting a new one
        if (recTimerRef.current) clearInterval(recTimerRef.current);

        setPart(partIdx, "recording");
        // FIX: read speakType from the ref, not from the `test` state closure
        const maxSec = MAX_RECORD_TIME[testPartsRef.current[partIdx].speakType];
        setRecLeft(maxSec);
        await recorder.startRecording();

        recTimerRef.current = setInterval(() => {
            setRecLeft(prev => {
                if (prev <= 1) {
                    clearInterval(recTimerRef.current!);
                    recorder.stopRecording().then(rec => {
                        setRecording(partIdx, rec);
                        setPart(partIdx, "done");
                        if (partIdx + 1 < testPartsRef.current.length) {
                            setCurrentPart(partIdx + 1);
                        }
                    });
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [recorder, setPart, setRecording]);

    const handleStart = useCallback(async (partIdx: number) => {
        const part    = testPartsRef.current[partIdx];
        if (!part) return;
        const prepSec = PREP_TIME[part.speakType];

        promptPlayer.stop();

        // FIX: clear any lingering prep timer before starting a new one
        if (prepTimerRef.current) clearInterval(prepTimerRef.current);

        if (prepSec > 0) {
            setPart(partIdx, "prep");
            setPrepLeft(prepSec);
            prepTimerRef.current = setInterval(() => {
                setPrepLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(prepTimerRef.current!);
                        beginRecording(partIdx);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            await beginRecording(partIdx);
        }
    }, [promptPlayer, setPart, beginRecording]);

    const handleStopEarly = useCallback(async (partIdx: number) => {
        if (recTimerRef.current) clearInterval(recTimerRef.current);
        const rec = await recorder.stopRecording();
        setRecording(partIdx, rec);
        setPart(partIdx, "done");
        if (partIdx + 1 < testPartsRef.current.length) {
            setCurrentPart(partIdx + 1);
        }
    }, [recorder, setRecording, setPart]);

    // ── Submit ────────────────────────────────────────────────────────────────

    const allDone = partStates.length > 0 && partStates.every(s => s === "done");

    const handleSubmit = useCallback(async () => {
        if (!test || submitting) return;

        setSubmitting(true);
        try {
            const testData: TestData[] = test.parts.map((part, i) => ({
                questionNumber: `Part ${i + 1}`,
                questionBody:   part.textBody,
                explanation:    part.explanation ?? "",
                userAnswer:     recordings[i]
                    ? `[Audio recorded – ${formatBytes(recordings[i]!.size)}]`
                    : "[No recording]",
                correctAnswer:  "",
                scoreRaw:       0,   // FIX: was missing — TestDataSchema requires this field
            }));

            await userService.CreateSession({
                // FIX: was `test: test._id`   — renamed to testRef to match updated service
                // FIX: was `user: user?.id`   — user is read from req.user._id on the backend
                // FIX: was `status: "completed"` — status lifecycle is backend-owned
                testRef:   test._id,
                testModel: "Speaking",
                testData,
                timeSpent: (test.metadata?.estimatedDuration ?? 15) * 60 - timeLeft,
            });

            setSubmitted(true);
            showToast("Speaking test submitted!", "SUCCESS");
        } catch (err: unknown) {
            showToast(
                (err as { response?: { data?: { message?: string } } })
                    ?.response?.data?.message ?? "Failed to submit. Please try again.",
                "ERROR",
            );
        } finally {
            setSubmitting(false);
        }
    }, [test, submitting, recordings, timeLeft, showToast]);

    // ── Guards ────────────────────────────────────────────────────────────────

    if (loading) return (
        <div className="flex h-screen items-center justify-center gap-3 text-base-content/50">
            <span className="loading loading-spinner loading-lg text-primary" />
            <span className="text-sm font-medium">Loading speaking test…</span>
        </div>
    );

    if (error || !test) return (
        <div className="flex h-screen items-center justify-center p-10">
            <div className="alert alert-error max-w-md">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error ?? "Test not found or failed to load."}</span>
            </div>
        </div>
    );

    // ── Submitted screen ──────────────────────────────────────────────────────

    if (submitted) {
        const recordedCount = recordings.filter(Boolean).length;
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 bg-base-100 text-base-content px-6">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30
                                    flex items-center justify-center mb-1">
                        <Mic size={28} className="text-indigo-400" />
                    </div>
                    <h2 className="text-2xl font-bold">Speaking submitted!</h2>
                    <p className="text-base-content/50 text-sm">Your responses have been submitted for review.</p>
                </div>

                <div className="w-full max-w-sm bg-base-200 rounded-2xl border border-base-300 p-5 space-y-4">
                    <p className="text-xs font-bold text-base-content/40 uppercase tracking-widest">Summary</p>
                    {test.parts.map((part, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                recordings[i] ? "bg-lime-600 text-white" : "bg-base-300 text-base-content/40"
                            }`}>
                                {recordings[i] ? <CheckCircle2 size={12} /> : <MicOff size={12} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-base-content truncate">
                                    {SPEAK_TYPE_LABEL[part.speakType]}
                                </p>
                                <p className="text-[10px] text-base-content/40">
                                    {recordings[i] ? formatBytes(recordings[i]!.size) : "Not recorded"}
                                </p>
                            </div>
                            {recordings[i] && <RecordingPlayback recording={recordings[i]!} />}
                        </div>
                    ))}
                    <div className="border-t border-base-300 pt-3 text-xs text-base-content/40">
                        {recordedCount}/{test.parts.length} parts recorded
                    </div>
                </div>

                {/* FIX: "Finish Exam" / "Next" → sentence case */}
                <Button
                    label="To menu page"
                    variant="primary"
                    icon={<ArrowRight size={18} />}
                    onClick={() => navigate("/menu/exam")}
                />
            </div>
        );
    }

    // ── Main render ───────────────────────────────────────────────────────────

    const completedCount = partStates.filter(s => s === "done").length;

    return (
        <div className="flex flex-col h-screen bg-base-100 overflow-hidden w-full">
            <ToastBanner toast={toast} />

            <>
                <HeaderForm
                    config={{
                                    typeLabel: "IELTS Speaking",
                                    title: test.title,
                                    topic: test.metadata?.topic
                    }}
                    telemetry={{
                                    timeLeft: timeLeft,
                                    answered: completedCount / test.parts.length,
                                    total: test.parts.length
                    }}
                    submitting={submitting}
                    onSubmit={handleSubmit}
                />
            
            </>

            <div className="flex flex-1 overflow-hidden">

                {/* Sidebar */}
                <aside className="w-44 border-r border-base-300 flex flex-col shrink-0 bg-base-50">
                    <div className="px-3 pt-4 pb-2">
                        <p className="text-[9px] font-bold text-base-content/30 uppercase tracking-widest">Parts</p>
                    </div>
                    <div className="flex flex-col gap-1.5 px-2 pb-4">
                        {test.parts.map((part, i) => {
                            const done   = partStates[i] === "done";
                            const active = i === currentPart;
                            return (
                                <button
                                    key={i}
                                    onClick={() => done && setCurrentPart(i)}
                                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                                               text-left text-xs font-semibold transition-all ${
                                        active ? "bg-indigo-600 text-white" :
                                            done   ? "bg-lime-900/30 text-lime-400 cursor-pointer hover:bg-lime-900/50" :
                                                "text-base-content/30 cursor-default"
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center
                                                      text-[9px] font-bold shrink-0 ${
                                        done   ? "bg-lime-600 text-white" :
                                            active ? "bg-white/20 text-white" :
                                                "bg-base-300 text-base-content/30"
                                    }`}>
                                        {done ? "✓" : i + 1}
                                    </span>
                                    <span className="truncate leading-tight">
                                        {part.speakType === "interview"  ? "Interview" :
                                            part.speakType === "cue_card"   ? "Cue card"  :
                                                "Discussion"}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {recorder.micError && (
                        <div className="mx-2 mt-auto mb-3 p-2.5 rounded-xl bg-rose-950/50
                                        border border-rose-800/40 text-[10px] text-rose-400 leading-relaxed">
                            <MicOff size={11} className="inline mr-1" />
                            {recorder.micError}
                        </div>
                    )}
                </aside>

                {/* Part cards */}
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="max-w-2xl mx-auto space-y-5">
                        <div className="flex items-start gap-3 bg-indigo-950/30 border border-indigo-800/30
                                        rounded-xl px-4 py-3 text-xs text-indigo-300/80 leading-relaxed">
                            <Mic size={13} className="mt-0.5 shrink-0 text-indigo-400" />
                            <span>
                                Work through each part in order. Listen to the prompt, then record your spoken
                                response. You can review your recording before submitting.
                            </span>
                        </div>

                        {test.parts.map((part, i) => (
                            <PartCard
                                key={i}
                                part={part}
                                partIndex={i}
                                partState={partStates[i] ?? "idle"}
                                recording={recordings[i]}
                                prepTimeLeft={prepLeft}
                                recTimeLeft={recLeft}
                                analyserRef={recorder.analyserRef}
                                isRecording={recorder.recording}
                                promptPlayer={promptPlayer}
                                onStart={() => handleStart(i)}
                                onStopEarly={() => handleStopEarly(i)}
                                isActive={i === currentPart}
                                isComplete={partStates[i] === "done"}
                            />
                        ))}

                        {allDone && (
                            <div className="flex flex-col items-center gap-3 py-4">
                                <p className="text-sm text-lime-400 font-semibold">
                                    All parts recorded — ready to submit.
                                </p>
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-8 py-2.5 rounded-xl text-sm font-bold
                                               bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50
                                               transition-all active:scale-[.98] disabled:opacity-50"
                                >
                                    {submitting
                                        ? <><span className="loading loading-ring loading-xs" /> Submitting…</>
                                        : <><CheckCircle2 size={15} /> Submit speaking test</>
                                    }
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right panel */}
                <aside className="w-64 border-l border-base-300 flex flex-col shrink-0 p-4 gap-4 bg-base-50 overflow-y-auto">
                    <div>
                        <p className="text-[9px] font-bold text-base-content/30 uppercase tracking-widest mb-3">
                            Timing guide
                        </p>
                        <div className="space-y-2">
                            {test.parts.map((part, i) => (
                                <div key={i} className={`flex items-center justify-between text-xs px-3 py-2
                                                          rounded-lg border transition-all ${
                                    i === currentPart
                                        ? "bg-indigo-950/30 border-indigo-800/30 text-indigo-300"
                                        : partStates[i] === "done"
                                            ? "bg-lime-950/20 border-lime-800/20 text-lime-500/70"
                                            : "bg-base-200 border-base-300 text-base-content/30"
                                }`}>
                                    <span className="font-semibold">Part {i + 1}</span>
                                    <span className="tabular-nums text-[10px]">
                                        {PREP_TIME[part.speakType] > 0
                                            ? `${PREP_TIME[part.speakType]}s prep · `
                                            : ""}
                                        {MAX_RECORD_TIME[part.speakType]}s max
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-base-300 pt-4">
                        <p className="text-[9px] font-bold text-base-content/30 uppercase tracking-widest mb-2">
                            Tips
                        </p>
                        <ul className="space-y-2 text-[11px] text-base-content/40 leading-relaxed">
                            <li className="flex gap-1.5"><span className="text-indigo-400 shrink-0">→</span> Speak naturally at a steady pace</li>
                            <li className="flex gap-1.5"><span className="text-indigo-400 shrink-0">→</span> Give detailed answers — avoid one-word responses</li>
                            <li className="flex gap-1.5"><span className="text-indigo-400 shrink-0">→</span> Use the full preparation time for cue cards</li>
                            <li className="flex gap-1.5"><span className="text-indigo-400 shrink-0">→</span> You can review each recording before submitting</li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default SpeakingMudExam;