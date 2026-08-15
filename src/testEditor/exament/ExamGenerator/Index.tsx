import { AlarmClock, Maximize2, Minimize2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button, Explain } from "../../../ui/UI";

// Encapsulated utility logic: Pure transformation function
const formatTime = (s: number): string => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
};

// Sub-Component 1: Isolated Timer Presentation Object
const Timer: React.FC<{ seconds: number }> = ({ seconds }) => {
  const isCritical = seconds < 10 * 60;
  return (
    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${
      isCritical ? "text-error animate-pulse" : "text-orange-500"
    }`}>
      <AlarmClock className="h-5 w-5" />
      {formatTime(seconds)}
      <span className="text-xs font-normal text-base-content/50 uppercase">remaining</span>
    </div>
  );
};

// Sub-Component 2: Isolated Progress Rendering Object
const ProgressBar: React.FC<{ answered: number; total: number }> = ({ answered, total }) => {
  const progressRatio = total ? (answered / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 h-1.5 rounded-full bg-base-300 overflow-hidden">
        <div
          className="h-full bg-lime-600 rounded-full transition-all duration-300"
          style={{ width: `${progressRatio}%` }}
        />
      </div>
      <span className="text-xs text-base-content/50">{answered}/{total}</span>
    </div>
  );
};

export interface HeaderConfig {
  typeLabel: string;       // e.g., "IELTS Reading"
  title: string;           // e.g., test.title
  topic?: string;          // e.g., test.metadata?.topic (optional)
}

export interface HeaderTelemetry {
  timeLeft: number;        // Countdown remaining in seconds
  answered: number;        // Number of questions completed
  total: number;           // Total questions in the test module
}

export interface HeaderProps {
  config: HeaderConfig;
  telemetry: HeaderTelemetry;
  submitting: boolean;     // Handles button loading loading states
  onSubmit: () => void;    // Triggers submission actions
}

// Main Composite Controller Component
export default function HeaderForm({ config, telemetry, submitting, onSubmit }: HeaderProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen exit via Escape key safely
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(err => console.error("Fullscreen error:", err));
    } else {
      document.exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(err => console.error("Exit fullscreen error:", err));
    }
  };

  return (
    <header 
        className="flex flex-col md:flex-row items-start md:items-center 
            justify-between px-4 md:px-6 py-3 border-b border-base-300 shrink-0 gap-3 md:gap-0 bg-base-100 w-full"
    >
      {/* Structural Data Cluster */}
      <div className="w-full md:w-auto">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-bold text-base uppercase text-indigo-400 tracking-wide whitespace-nowrap">
            {config.typeLabel}
          </h1>
          {config.topic && (
            <span className="badge badge-sm badge-ghost text-xs">{config.topic}</span>
          )}
        </div>
        <p className="text-sm text-base-content/60 mt-1">{config.title}</p>
      </div>
      
      {/* Telemetry Actions Cluster */}
      <div className="w-full md:w-auto flex flex-col-reverse md:flex-row items-stretch md:items-center gap-3 md:gap-6">
        <div className="flex flex-wrap items-center gap-4 md:gap-6 justify-between md:justify-start">
          <Timer seconds={telemetry.timeLeft} />
          <ProgressBar answered={telemetry.answered} total={telemetry.total} />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="hidden sm:flex items-center gap-2 text-xs bg-base-100 px-3 py-1.5 rounded border border-base-200">
            <Explain>
              <kbd className="kbd kbd-xs">Ctrl</kbd> + <kbd className="kbd kbd-xs">F</kbd> / <kbd className="kbd kbd-xs">V</kbd>
              <p className="capitalize text-base-content">not working</p>
            </Explain>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Full Screen Button */}
            <button 
              onClick={toggleFullscreen}
              className="btn btn-sm btn-ghost gap-2 normal-case shrink-0"
              aria-label="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              <span className="hidden md:inline">{isFullscreen ? "Exit Fullscreen" : "Full Screen"}</span>
            </button>

            <Button
              label="Submit test"
              variant="submit"
              onClick={onSubmit}
              loading={submitting}
              className="w-full md:w-auto shrink-0"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
