import { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, Mic } from "lucide-react";
import { Button } from "../../../../ui/UI";

export default function AudioPlayer({
    src,
    onError,
}: {
    src: string;
    onError?: () => void;
}) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [current, setCurrent] = useState(0);

    // reset state when the src changes
    useEffect(() => {
        setPlaying(false);
        setProgress(0);
        setDuration(0);
        setCurrent(0);
    }, [src]);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (playing) {
            audio.pause();
        } else {
            audio.play().catch(() => onError?.());
        }
        setPlaying(!playing);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => {
            setCurrent(audio.currentTime);
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const handleEnded = () => setPlaying(false);
        const handleError = () => onError?.();

        audio.addEventListener("timeupdate", handleTimeUpdate);
        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("error", handleError);

        return () => {
            audio.removeEventListener("timeupdate", handleTimeUpdate);
            audio.removeEventListener("ended", handleEnded);
            audio.removeEventListener("error", handleError);
        };
    }, [onError]);

    const format = (sec: number) => {
        if (!isFinite(sec)) return "0:00";
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, "0")}`;
    };

    const seek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const ratio = (e.clientX - rect.left) / rect.width;
        audio.currentTime = ratio * duration;
    };

    return (
        <div className="rounded-2xl border bg-base-100 shadow-lg p-6 flex items-center gap-6">
            <audio
                ref={audioRef}
                src={src}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            />

            <div className="avatar placeholder">
                <div
                    className={`w-20 rounded-full bg-primary/10 text-primary ring ring-offset-base-100 ring-offset-2 transition-all duration-300 
                        justify-center items-center
                        ${
                        playing ? "ring-lime-500 ring-4" : "ring-primary/30 ring-2"
                    }`}
                >
                    <Mic className="w-full" size={80}/>
                </div>
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-lg">IELTS Examiner</h3>
                <p className="text-sm opacity-60">British Male Voice</p>

                <div className="cursor-pointer" onClick={seek}>
                    <progress
                        className="progress progress-primary w-full mt-4"
                        value={isNaN(progress) ? 0 : progress}
                        max="100"
                    />
                </div>

                <div className="flex justify-between text-xs mt-1 opacity-70">
                    <span>{format(current)}</span>
                    <span>{format(duration)}</span>
                </div>
            </div>

            <Button
                icon={playing ? <Pause /> : <Play />}
                label={playing ? "Pause" : "Play"}
                onClick={togglePlay}
                variant="ghost"
                aria-label={playing ? "Pause" : "Play"}
            />
                

            <Button 
                icon={<Volume2 />}
                variant="ghost"
            />
        </div>
    );
}