/**
 *  User interface Props 
 * 
 */

import {useState, forwardRef, type ComponentPropsWithoutRef, type ReactNode} from "react";
import {motion, type HTMLMotionProps, AnimatePresence} from "motion/react";
import * as React from "react";
import { Info, NotepadText } from "lucide-react";

type NativeButtonProps = Omit<ComponentPropsWithoutRef<"button">, keyof HTMLMotionProps<"button">>;

export interface ButtonProps extends NativeButtonProps {
    variant?: "primary" | "secondary" | "ghost" | "reset" | "sand" | "save" | "submit" | "gold" | "outline";
    size?: "sm" | "md" | "lg";
    className?: string | null;
    label?: string;
    title?: string;
    hoverText?: string | null;
    //isBloked?: boolean;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    icon?: ReactNode;
    pulse?: boolean;
    loading?: boolean;
    disabled?: boolean;
    success?: boolean;
    children?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
                                                                    className = null,
                                                                    label = null,
                                                                    hoverText = null,
                                                                    variant = "primary",
                                                                    size = "sm",
                                                                    title,
                                                                    icon,
                                                                    pulse = true,
                                                                    loading = false,
                                                                    disabled = false,
                                                                    success = false,
                                                                    children,
                                                                    onClick,
                                                                    ...props
                                                                  }, ref) => {
        const [ripples, setRipples] = useState<{ id: number; x: number; y: number; d: number }[]>([]);

        const base = "inline-flex items-center justify-center font-medium transition-colors duration-200 rounded-xl " +
            "disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer gap-2 relative overflow-hidden select-none";

        const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
            primary:    "text-indigo-600    bg-transparent  border border-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950",
            outline:    "text-slate-600    bg-transparent  border border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-950",
            gold:       "text-yellow-500 border border-yellow-500/80 hover:bg-yellow-500/10 dark:text-amber-400 dark:border-amber-400/80 dark:hover:bg-amber-400/10 shadow-sm transition-colors",
            sand:       "text-green-600     bg-transparent  border border-green-600 hover:bg-green-50 dark:hover:bg-green-950",
            secondary:  "text-violet-600    bg-transparent  border border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950",
            reset:      "text-white         bg-rose-700     hover:bg-rose-800    shadow-lg shadow-rose-500/40",
            ghost:      "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest border border-slate-700 " +
                        "text-white hover:text-slate-200 hover:bg-slate-800 transition-all disabled:opacity-40",
            save:       "text-emerald-600 bg-transparent    border border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950",
            submit:     "text-cyan-600   bg-transparent    border border-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950",
        };

        const sizes: Record<NonNullable<ButtonProps["size"]>, string> = {
            sm: "px-3 py-1.5 text-sm",
            md: "px-5 py-2.5 text-base",
            lg: "px-8 py-3 text-lg",
        };

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (loading || success) return;
            if (pulse) {
                const rect = e.currentTarget.getBoundingClientRect();
                const d = Math.max(rect.width, rect.height) * 2;
                const x = e.clientX - rect.left - d / 2;
                const y = e.clientY - rect.top - d / 2;
                const id = Date.now();
                setRipples(r => [...r, {id, x, y, d}]);
                setTimeout(() => setRipples(r => r.filter(rp => rp.id !== id)), 600);
            }
            onClick?.(e);
        };

        return (
            <motion.button
                ref={ref}
                onClick={handleClick}
                disabled={loading || disabled}
                title={title}
                className={`${base} ${variants[variant]} ${sizes[size]} ${className ?? ""} tooltip tooltip-info`}
                {...(props as HTMLMotionProps<"button">)}
                whileHover={!loading ? {scale: 1.05, y: -2} : {}} 
                whileTap={!loading ? {scale: 0.96, y: 1} : {}}
                transition={{type: "spring", stiffness: 400, damping: 18}}
                data-tip={hoverText as string}
            >
                {/* ripple layer */}
                {ripples.map(rp => (
                    <motion.span
                        key={rp.id}
                        style={{
                            position: "absolute", borderRadius: "50%",
                            background: "rgba(255,255,255,0.28)",
                            width: rp.d, height: rp.d, left: rp.x, top: rp.y,
                            pointerEvents: "none",
                        }}
                        initial={{scale: 0, opacity: 1}}
                        animate={{scale: 1, opacity: 0}}
                        transition={{duration: 0.55, ease: [0.4, 0, 0.2, 1]}}
                    />
                ))}

                {/* content */}
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.span
                            key="loading"
                            className="inline-flex items-center gap-2"
                            initial={{opacity: 0, y: 6}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -6}}
                            transition={{duration: 0.15}}
                        >
                            <motion.span
                                className="block w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                                animate={{rotate: 360}}
                                transition={{repeat: Infinity, duration: 0.7, ease: "linear"}}
                            />
                            Loading…
                        </motion.span>
                    ) : success ? (
                        <motion.span
                            key="success"
                            className="inline-flex items-center gap-1.5"
                            initial={{scale: 0.6, opacity: 0}}
                            animate={{scale: 1, opacity: 1}}
                            exit={{scale: 0.6, opacity: 0}}
                            transition={{type: "spring", stiffness: 600, damping: 18}}
                        >
                            ✓ Done
                        </motion.span>
                    ) : (
                        <motion.span
                            key="idle"
                            className="inline-flex items-center gap-2"
                            initial={{opacity: 0, y: 4}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: -4}}
                            transition={{duration: 0.15}}
                        >
                            {icon}
                            {children}
                            {label && <span className="capitalize">{label}</span>}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>
        );
    }
);
Button.displayName = "Button";

// ─── Label ────────────────────────────────────────────────────────────────────

export const Label: React.FC<{
    children: React.ReactNode;
    htmlFor?: string;
    required?: boolean;
}> = ({ children, htmlFor, required }) => (
    <motion.label
        htmlFor={htmlFor}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="block text-xs font-semibold tracking-widest text-base-content mb-1.5 capitalize"
    >
        {children}
        {required && <span className="text-rose-500 ml-1">*</span>}
    </motion.label>
);
Label.displayName = "Label";

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        {...props}
        className={`w-full max-w-2xl bg-slate-800/70 border border-slate-900/50 rounded-lg px-3 py-2.5
            text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-200/90 focus:shadow-md focus:shadow-indigo-200/90 
            focus:border-transparent transition-all ${props.className ?? ""}`}
    />
);

export const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
    <textarea
        {...props}
        className={`textarea w-full bg-slate-800/60 border border-slate-900/50 rounded-lg px-3 py-2.5 text-sm
            text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-900/90
            focus:border-transparent transition-all resize-none ${props.className ?? ""}`}
    />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = ({
                                                                                    children,
                                                                                    ...props
                                                                                }) => (
    <select
        {...props}
        className={`placeholder:text-slate-600 disabled:opacity-50
                w-full bg-base-100/60 border border-slate-900/50 rounded-lg px-3 py-2.5 text-sm
                text-base-content focus:outline-none focus:ring-2
                focus:ring-indigo-200/90 focus:shadow-md focus:shadow-indigo-200/90
                focus:border-transparent transition-all appearance-none cursor-pointer ${props.className ?? ""}`}
    >
        {children}
    </select>
);

// ─── SectionCard ─────────────────────────────────────────────────────────────

export interface SectionCardProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    accent?: string;
    action?: ReactNode;
}

export const SectionCard: React.FC<SectionCardProps> = ({
                                                            title,
                                                            subtitle,
                                                            children,
                                                            accent = "from-indigo-500 to-violet-500",
                                                            action,
                                                        }) => (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl w-full shadow-slate-500/50">
        <div className={`h-0.5 bg-linear-to-br ${accent}`} />
        <div className="p-6">
            <div className="flex items-start justify-between mb-5">
                <div>
                    <h2 className="text-base font-bold text-slate-100 tracking-tight capitalize">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
                {action && <div className="shrink-0 ml-4">{action}</div>}
            </div>
            {children}
        </div>
    </div>
);
SectionCard.displayName = "SectionCard";

// ─── Section Zone ──────────────────────────────────────────────────────────────────────

/**
 * Color gradient presets for section accents
 */
const GRADIENT_PRESETS = {
  indigo: 'from-indigo-500 to-violet-500',
  blue: 'from-blue-500 to-cyan-500',
  rose: 'from-rose-500 to-pink-500',
  emerald: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  purple: 'from-purple-500 to-fuchsia-500',
  slate: 'from-slate-400 to-slate-500',
  none: '',
} as const;
 
type GradientPreset = keyof typeof GRADIENT_PRESETS;
 
interface SectionZoneProps {
  title: string;
  icon?: ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  accent?: GradientPreset | 'none';
  optional?: string;
  className?: string;
}
 
/**
 * SectionZone Component
 * 
 * A flexible container for organizing form sections with optional accent bar.
 * Uses semantic HTML and proper Tailwind styling.
 * 
 * @example
 * <SectionZone 
 *   title="Personal Information"
 *   subtitle="Enter your details"
 *   accent="indigo"
 * >
 *   <input type="text" placeholder="Name" />
 * </SectionZone>
 */
export const SectionZone: React.FC<SectionZoneProps> = ({
  title,
  icon,
  subtitle,
  children,
  accent = 'indigo',
  optional,
  className = '',
}) => {
  
  return (
    <section
      className={`
        rounded-xl border border-base-300 bg-base-100
        overflow-y-auto shadow-sm
        ${className}
      `}
      role="region"
      aria-labelledby={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
    >
      {/* Accent bar at top */}
      {accent !== 'none' && (
        <div className={`h-1 bg-linear-to-r ${GRADIENT_PRESETS[accent]}`} />
      )}
 
      {/* Header section */}
      <div className="px-6 pt-5 pb-3 border-b border-base-300/50">
      <div className="flex items-center gap-2 mb-3">
            {icon}
            {/* Title */}
            <h3
                id={`section-title-${title.replace(/\s+/g, '-').toLowerCase()}`}
                className="text-base font-semibold text-base-content capitalize tracking-wide"
            >
                {title}
            </h3>
      </div>
        
 
        {/* Subtitle */}
        {subtitle && (
          <p className="text-xs text-base-content/60 mt-1 capitalize italic">
            {subtitle}
          </p>
        )}
      </div>
 
      {/* Content section */}
      <div className="px-6 py-5 space-y-4">
        {children}
      </div>
 
      {/* Optional footer text */}
      {optional && (
        <div className="px-6 py-3 bg-base-200/40 border-t border-base-300/50">
          <p className="text-xs text-base-content/70">
            {optional}
          </p>
        </div>
      )}
    </section>
  );
};
 
/**
 * Variant: SectionCard
 * 
 * Alternative variant with more padding and different styling.
 * Good for highlighting important sections.
 */
export const Section: React.FC<SectionZoneProps> = (props) => {
  return (
    <SectionZone
      {...props}
      className={`border-2 border-base-300 bg-linear-to-br from-base-100 to-base-200/50 ${props.className || ''}`}
    />
  );
};
 
/**
 * Variant: SectionSimple
 * 
 * Minimal variant without accent bar or border.
 * Good for subtle section grouping.
 */
export const SectionSimple: React.FC<Omit<SectionZoneProps, 'accent'>> = (props) => {
  return (
    <SectionZone
      {...props}
      accent="none"
      className={`border-0 bg-transparent shadow-none ${props.className || ''}`}
    />
  );
};
 
/**
 * Variant: SectionHighlight
 * 
 * Emphasized variant with filled accent bar.
 * Good for primary actions or important info.
 */
export const SectionHighlight: React.FC<SectionZoneProps> = (props) => {
  const accentGradient = props.accent && props.accent !== 'none' 
    ? GRADIENT_PRESETS[props.accent] 
    : GRADIENT_PRESETS.indigo;
 
  return (
    <SectionZone
      {...props}
      className={`
        border-0 
        bg-linear-to-br ${accentGradient}
        bg-opacity-5
        ${props.className || ''}
      `}
    />
  );
};


// ─── Tag ──────────────────────────────────────────────────────────────────────

export interface TagProps {
    children: ReactNode;
    onRemove?: () => void;
    color?: "indigo" | "rose" | "emerald" | "amber";
}

const tagColors: Record<NonNullable<TagProps["color"]>, string> = {
    indigo:  "bg-indigo-900/50  text-indigo-300  border-indigo-700/50  [&_button]:text-indigo-400  [&_button]:hover:text-rose-400",
    rose:    "bg-rose-900/50    text-rose-300    border-rose-700/50    [&_button]:text-rose-400    [&_button]:hover:text-white",
    emerald: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50 [&_button]:text-emerald-400 [&_button]:hover:text-rose-400",
    amber:   "bg-amber-900/50   text-amber-300   border-amber-700/50   [&_button]:text-amber-400   [&_button]:hover:text-rose-400",
};

export const Tag: React.FC<TagProps> = ({ children, onRemove, color = "indigo" }) => (
    <span
        className={`inline-flex items-center gap-1 shadow-lg shadow-slate-500/50 text-xs font-medium px-2.5 py-1 rounded-full border capitalize ${tagColors[color]}`}
    >
        {children}
        {onRemove && (
            <button
                type="button"
                onClick={onRemove}
                aria-label="Remove"
                className="ml-1 transition-colors leading-none"
            >
                ×
            </button>
        )}
    </span>
);
Tag.displayName = "Tag";

// ─── Tag 2 ──────────────────────────────────────────────────────────────────────

export const Tag_2: React.FC<TagProps> = ({ children, onRemove, color = "indigo" }) => (
    <span
        className={`inline-flex items-center gap-1 shadow-lg shadow-slate-500/50 text-xs font-medium 
            px-2.5 py-1 rounded-full border capitalize ${tagColors[color]}`}
    >
        {children}
        {onRemove && (
            <button
                type="button"
                onClick={onRemove}
                aria-label="Remove"
                className="ml-1 transition-colors leading-none"
            >
                ×
            </button>
        )}
    </span>
);
Tag_2.displayName = "Tag_2";

interface ItemProps {
  text: string | number;
  color?: "indigo" | "rose" | "emerald" | "amber" | "secondary";
}

type ColorKey = NonNullable<ItemProps["color"]>;

const BASE_STYLES = "inline-flex max-w-100 items-center justify-center gap-1 text-xs font-medium " + 
        "px-2 py-1 rounded-sm border capitalize shadow-lg shadow-slate-500/50 line-clamp-1";

const ItemColors: Record<ColorKey, string> = {
  indigo:  "bg-indigo-900/50 text-indigo-300 border-indigo-700/50 [&_button]:text-indigo-400 [&_button]:hover:text-indigo-200",
  rose:    "bg-rose-900/50 text-rose-300 border-rose-700/50 [&_button]:text-rose-400 [&_button]:hover:text-rose-200",
  emerald: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50 [&_button]:text-emerald-400 [&_button]:hover:text-emerald-200",
  amber:   "bg-amber-900/50 text-amber-300 border-amber-700/50 [&_button]:text-amber-400 [&_button]:hover:text-amber-200",
  secondary:   "bg-slate-900/50 text-slate-300 border-slate-700/50 [&_button]:text-slate-400 [&_button]:hover:text-slate-200",
};

export const Item: React.FC<ItemProps> = ({ text, color = "indigo" }) => (
  <span className={`${BASE_STYLES} ${ItemColors[color]}`}>
    {text}
  </span>
);

Item.displayName = "Item";

// ─── Field ────────────────────────────────────────────────────────────────────

export interface FieldProps {
    label: string;
    htmlFor: string;
    hint?: string;
    required?: boolean;
    error?: string;
    children: ReactNode;
}

export const Field: React.FC<FieldProps> = ({
                                                label,
                                                htmlFor,
                                                hint,
                                                required,
                                                error,
                                                children,
                                            }) => (
    <div className="flex flex-col w-full h-full gap-2 p-5 overflow-y-auto" >
        <div className="flex items-baseline justify-between">
            <Label
                htmlFor={htmlFor}
            >
                <div className="flex flex-1 gap-0.5" >
                    <p className="capitalize">{label}</p>
                    {required && <span className="ml-1 text-rose-400" aria-hidden>*</span>}
                    {required && <span className="sr-only">(required)</span>}
                </div>
                
            </Label>
            {hint && <Explain >{hint}</Explain>}
        </div>
        {children}
        {error && (
            <p role="alert" className="text-xs text-rose-400 mt-0.5">
                {error}
            </p>
        )}
        {!required && !error && (
            <span className="label capitalize text-xs text-lime-600">Optional</span>
        )}
    </div>
);
Field.displayName = "Field";

// ─── Items ────────────────────────────────────────────────────────────────────

export const Items: React.FC<{ children: React.ReactNode; id: string }> = ({ children, id }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="list">
            <motion.div
                key={id}
                className="list-item"
                layout
                onClick={() => setIsExpanded((prev) => !prev)}
                drag
            >
                <h3>Item {id}</h3>
                {isExpanded && (
                    <motion.i
                        className="item-details capitalize text-sm text-base-content/80"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                    >
                        {children}
                    </motion.i>
                )}
            </motion.div>
        </div>
    );
};
Items.displayName = "Items";

// ─── Explain ────────────────────────────────────────────────────────────────────

export const Explain: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (!visible) return;
        const handler = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setVisible(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [visible]);

    return (
        <div ref={ref} className="relative inline-flex items-center tooltip tooltip-top" data-tip={'Note'}>
            <button
                type="button"
                aria-label="More information"
                aria-expanded={visible}
                className="w-auto rounded-4xl border-0 bg-slate-600/95 text-white 
                           hover:bg-slate-700/80 transition-colors flex items-center justify-center"
                onClick={() => setVisible(v => !v)}
            >
                <Info size={16} />
            </button>

            <AnimatePresence>
                {visible && (
                    <motion.div
                        //role="tooltip"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        drag
                        dragConstraints={{ left: -200, top: -200, right: 200, bottom: 200 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: "easeOut", type: "spring", stiffness: 300, damping: 22 }}
                        whileHover={{ opacity: 1 }}
                        className="absolute top-full right-0 mt-2 z-50 min-w-48 max-w-xs p-3 
                                   rounded-lg border border-slate-950/50 bg-slate-900/20 text-white
                                   shadow-lg shadow-slate-500/50 backdrop-blur-sm origin-top-right"
                    >
                        <p className="text-sm font-medium leading-normal whitespace-normal wrap-break-word capitalize z-1000">
                            {children}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
Explain.displayName = "Explain";

// ─── Big Fish ────────────────────────────────────────────────────────────────────

const actions = [
    {
        label: "Camera",
        icon: (
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg"
                 fill="none"
                 viewBox="0 0 24 24"
                 strokeWidth="1.5"
                 stroke="currentColor"
                 className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999
                7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865
                47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0
                2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75
                10.5h.008v.008h-.008V10.5Z" />
            </svg>
        ),
    },
    {
        label: "Gallery",
        icon: (
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 24 24"
                 strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182
                0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0
                1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375
                0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
        ),
    },
    {
        label: "Voice",
        icon: (
            <svg aria-hidden xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0
                1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
            </svg>
        ),
    },
];

export const BigFish = () => {
    const [open, setOpen] = useState(false);

    return (
        <div className="fab">
            {/* action buttons — stagger in above the FAB */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="flex flex-col items-center gap-3"
                        initial="closed"
                        animate="open"
                        exit="closed"
                        variants={{
                            open:   { transition: { staggerChildren: 0.07 } },
                            closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
                        }}
                    >
                        {actions.map(({ label, icon }) => (
                            <motion.button
                                key={label}
                                type="button"
                                aria-label={label}
                                className="btn btn-lg btn-circle"
                                variants={{
                                    open:   { opacity: 1, y: 0,   scale: 1 },
                                    closed: { opacity: 0, y: 16,  scale: 0.8 },
                                }}
                                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.93 }}
                            >
                                {icon}
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* FAB */}
            <motion.div
                className="fab"
                drag
                dragConstraints={{ left: -20, top: -20, right: 20, bottom: 20 }}
                dragSnapToOrigin
                dragElastic={0.15}
                dragMomentum={false}
                whileDrag={{ scale: 1.08, cursor: "grabbing" }}
            >
                <button
                    type="button"
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                    className="btn btn-lg btn-circle btn-secondary"
                    onClick={() => setOpen(v => !v)}
                >
                    <motion.svg
                        aria-hidden
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                        className="size-6"
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </motion.svg>
                </button>
            </motion.div>
        </div>
    );
};
BigFish.displayName = "BigFish";

// ─── Fish ────────────────────────────────────────────────────────────────────

interface FishProps {
    children?: React.ReactNode;
    onClick?: () => void;
}

export const Fish: React.FC<FishProps> = ({ children, onClick }) => {
    return (
        <motion.button
            onClick={onClick}
            className="fixed bottom-6 right-6 z-100 flex items-center justify-center 
                       w-16 h-16 rounded-full bg-primary text-secondary-content
                       shadow-2xl cursor-grab active:cursor-grabbing"
            drag
            dragConstraints={{ left: -50, top: -200, right: 0, bottom: 0 }}
            dragSnapToOrigin
            dragElastic={0.15}
            dragMomentum={false}
            whileDrag={{ scale: 1.15, boxShadow: "0px 20px 30px rgba(0,0,0,0.3)" }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="flex items-center justify-center w-full h-full p-1">
                {children || <NotepadText size={35} />}
            </div>
        </motion.button>
    );
};

Fish.displayName = "Fish";

export const Menu: React.FC<SectionZoneProps> = ({
  title,
  subtitle,
  children,
  optional,
  className = '',
}) => {
  // Generate a safe, consistent ID for aria-labelledby
  const sectionId = `section-title-${title.trim().replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <section
      className={`rounded-xl border border-base-300 bg-base-100/90 overflow-hidden shadow-sm w-full h-full overflow-y-auto ${className}`}
      role="region"
      aria-labelledby={sectionId}
    >
      {/* Header section */}
      <div className="px-10 pt-5 pb-3 border-b border-base-200/20 bg-base-200/10 space-y-4">
        {/* Title */}
        <Label>
          <h3 id={sectionId} className="text-base font-semibold text-base-content capitalize tracking-wide">
            {title}
          </h3>
        </Label>

        {/* Subtitle */}
        {subtitle && (
          <Label>
            <p className="text-xs text-base-content/60 mt-1 capitalize italic">
              {subtitle}
            </p>
          </Label>
        )}
      </div>

      {/* Decorative Gradient Line */}
      <div className="w-full px-10">
        <div className="h-0.5 w-full bg-linear-to-r from-primary to-transparent" />
      </div>

      {/* Content section */}
      <div className="p-6 grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-3 gap-4 bg-base-200/10 min-w-full">
        {children}
      </div>

      {/* Optional footer text */}
      {optional && (
        <div className="px-6 py-3 w-full bg-base-200/40 border-t border-base-300/50 flex justify-end">
          <Label>
            <p className="text-xs text-base-content/70 capitalize italic">
              {optional}
            </p>
          </Label>
        </div>
      )}
    </section>
  );
};

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "outline" | "ghost";
type BadgeSize = "xs" | "sm" | "md" | "lg";

interface BadgeProps {
  label: string | React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
}

/**
 * ✅ Badge Component
 * Reusable badge/chip for displaying status, tags, counts, etc.
 * 
 * Usage:
 * <Badge label="Pro Plan" variant="primary" size="sm" />
 * <Badge label="5 Remaining" icon={<Clock size={14} />} variant="warning" />
 * <Badge label="Unlimited" variant="outline" />
 */
const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  primary: {
    bg: "bg-primary/90",
    text: "text-primary-content",
    border: "border-primary/40",
  },
  secondary: {
    bg: "bg-secondary/90",
    text: "text-secondary-content",
    border: "border-secondary/40",
  },
  success: {
    bg: "bg-success/90",
    text: "text-success-content",
    border: "border-success/40",
  },
  warning: {
    bg: "bg-warning/90",
    text: "text-warning-content",
    border: "border-warning/40",
  },
  error: {
    bg: "bg-error/90",
    text: "text-error-content",
    border: "border-error/40",
  },
  info: {
    bg: "bg-info/90",
    text: "text-info-content",
    border: "border-info/40",
  },
  outline: {
    bg: "bg-transparent",
    text: "text-slate-300",
    border: "border-slate-600/50",
  },
  ghost: {
    bg: "bg-transparent",
    text: "text-slate-400",
    border: "border-transparent",
  },
};

const SIZE_STYLES: Record<BadgeSize, { px: string; py: string; text: string; gap: string }> = {
  xs: {
    px: "px-1.5",
    py: "py-0.5",
    text: "text-[10px]",
    gap: "gap-0.5",
  },
  sm: {
    px: "px-2",
    py: "py-1",
    text: "text-xs",
    gap: "gap-1",
  },
  md: {
    px: "px-3",
    py: "py-1.5",
    text: "text-sm",
    gap: "gap-1.5",
  },
  lg: {
    px: "px-4",
    py: "py-2",
    text: "text-base",
    gap: "gap-2",
  },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = "primary",
  size = "sm",
  icon,
  className = "",
  onClick,
  title,
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  const baseClasses = `
    inline-flex items-center rounded-full border font-semibold justify-center p-1
    transition-all duration-200 whitespace-nowrap
    ${sizeStyle.px} ${sizeStyle.py}
    ${sizeStyle.text} ${sizeStyle.gap}
    ${variantStyle.bg} ${variantStyle.text} ${variantStyle.border}
    ${onClick ? "cursor-pointer hover:opacity-80" : ""}
    ${className}
  `;

  return (
    <div
      className={baseClasses}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={title}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <Label>{label}</Label>
    </div>
  );
};

export default Badge;


