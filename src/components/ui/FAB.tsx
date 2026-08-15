import { useState } from "react";
import "./style_2.scss";
import { ArrowUpNarrowWide, Blinds, MicVocal, MessagesSquare } from "lucide-react";
import { motion } from "motion/react";

export const FAB = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Backdrop — click to close */}
            {open && (
                <div
                    className="fab__backdrop"
                    onClick={() => setOpen(false)}
                    aria-hidden="true"
                />
            )}

            <div className={`fab${open ? " is-open" : ""}`}>
                {/* Secondary actions — visible when open */}
                <button
                    className="fab__btn"
                    aria-label="New voice"
                    onClick={() => setOpen(false)}
                >
                    <MicVocal />
                </button>

                <button
                    className="fab__btn"
                    aria-label="New gallery photo"
                    onClick={() => setOpen(false)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4Zm10.5 5.707a.5.5 0 0 0-.146-.353l-1-1a.5.5 0 0 0-.708 0L9.354 9.646a.5.5 0 0 1-.708 0L6.354 7.354a.5.5 0 0 0-.708 0l-2 2a.5.5 0 0 0-.146.353V12a.5.5 0 0 0 .5.5h8a.5.5 0 0 0 .5-.5V9.707ZM12 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                <button
                    className="fab__btn"
                    aria-label="Talks"
                    onClick={() => setOpen(false)}
                >
                    <MessagesSquare />
                </button>

                <button
                    className="fab__btn"
                    aria-label="New camera photo"
                    onClick={() => setOpen(false)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path d="M9.5 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        <path
                            fillRule="evenodd"
                            d="M2.5 5A1.5 1.5 0 0 0 1 6.5v5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 13.5 5h-.879a1.5 1.5 0 0 1-1.06-.44l-1.122-1.12A1.5 1.5 0 0 0 9.38 3H6.62a1.5 1.5 0 0 0-1.06.44L4.439 4.56A1.5 1.5 0 0 1 3.38 5H2.5ZM11 8.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                <button
                    className="fab__btn fab__main-action-secondary"
                    aria-label="New post"
                    onClick={() => setOpen(false)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M11.013 2.513a1.75 1.75 0 0 1 2.475 2.474L6.226 12.25a2.751 2.751 0 0 1-.892.596l-2.047.848a.75.75 0 0 1-.98-.98l.848-2.047a2.75 2.75 0 0 1 .596-.892l7.262-7.261Z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>

                {/* Toggle wrap: trigger + main-action share same spot */}
                <motion.div 
                    className="fab__toggle-wrap"
                    drag
                    dragConstraints={{ left: -20, top: -20, right: 20, bottom: 20 }}
                    dragSnapToOrigin
                    dragElastic={0.15}
                    dragMomentum={false}
                    whileDrag={{ scale: 1.08, cursor: "grabbing" }}
                >
                    {/* Trigger — the neutral + button */}
                    <div
                        tabIndex={0}
                        role="button"
                        className="fab__trigger"
                        aria-label="New"
                        aria-expanded={open}
                        onClick={() => setOpen(true)}
                        onKeyDown={(e) => e.key === "Enter" && setOpen(true)}
                    >
                        <Blinds />
                    </div>

                    {/* Main action — golden edit button */}
                    <button
                        className="fab__main-action"
                        aria-label="New post"
                        onClick={() => setOpen(false)}
                    >
                        <ArrowUpNarrowWide />
                    </button>
                </motion.div>
            </div>
        </>
    );
};