import type React from "react";
import { Brain, Clock } from "lucide-react";
import type { SpeakTest } from "./speak";
import { DIFFICULTY_CLASSES } from "..";
import { ItemCard, ItemHeader, ItemBody, ItemFooter } from "../ItemsControl";


interface SpeakItemProps {
    speak: SpeakTest;
    onEdit: (speak: SpeakTest) => void;
    onDelete: (id: string) => Promise<void>;
    onPublish: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    busy: boolean;
}

export const SpeakItem: React.FC<SpeakItemProps> = ({
    speak,
    onEdit,
    onDelete,
    onPublish,
    onArchive,
    busy,
}) => {
    const partsCount = speak.parts?.length ?? 0;

    return (
        <ItemCard status={speak.status}>
            <ItemHeader title={speak.title} fallbackTitle="Untitled Speaking Test" status={speak.status} />

            <ItemBody
                description={speak.description}
                metas={[
                    ...(speak.parts ? [{ key: "parts", icon: <Brain size={10} />, label: `Parts: ${partsCount}` }] : []),
                    ...(speak.metadata?.estimatedDuration
                        ? [{
                            key: "duration",
                            icon: <Clock size={10} />,
                            label: `${speak.metadata.estimatedDuration} Mins`,
                        }]
                        : []),
                    ...(speak.metadata?.type ? [{ key: "type", label: speak.metadata.type }] : []),
                ]}
            />

            {/* Difficulty badge uses a per-level color map, so it stays local rather than in the generic tag list */}
            {speak.metadata?.level && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold
                    uppercase tracking-wider w-fit ${DIFFICULTY_CLASSES[speak.metadata?.level] || "border-slate-700 text-slate-400"}`}>
                    {speak.metadata?.level}
                </span>
            )}

            <ItemFooter
                status={speak.status}
                busy={busy}
                onPublish={() => onPublish(speak._id)}
                onArchive={() => onArchive(speak._id)}
                onEdit={() => onEdit(speak)}
                onDelete={() => onDelete(speak._id)}
            />
        </ItemCard>
    );
};