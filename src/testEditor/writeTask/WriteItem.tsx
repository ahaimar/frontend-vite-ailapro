import type React from "react";
import { Gift, CheckCircle2 } from "lucide-react";
import { type TaskType, type WriteTest, TASK_TYPE_LABELS } from "./writeDTO.ts";
import { ItemCard, ItemHeader, ItemBody, ItemFooter } from "../ItemsControl.tsx";


interface WriteItemProps {
    write: WriteTest;
    onEdit: (write: WriteTest) => void;
    onDelete: (id: string) => Promise<void>;
    onPublish: (id: string) => Promise<void>;
    onArchive: (id: string) => Promise<void>;
    busy: boolean;
}

export const WriteItem: React.FC<WriteItemProps> = ({
    write,
    onEdit,
    onDelete,
    onPublish,
    onArchive,
    busy,
}) => {
    return (
        <ItemCard status={write.status}>
            <ItemHeader title={write.title} fallbackTitle="Untitled Test" status={write.status} />

            <ItemBody
                metas={[
                    { key: "tasks", label: `${write.tasks?.length ?? 0} Tasks` },
                    ...(write.metadata?.estimatedDuration
                        ? [{ key: "duration", label: write.metadata.estimatedDuration }]
                        : []),
                    ...(write.metadata?.topic ? [{ key: "topic", label: write.metadata.topic }] : []),
                    ...(write.metadata?.type ? [{ key: "type", label: write.metadata.type }] : []),
                ]}
                description={write.description}
                tagClassName="inline-flex items-center px-2 py-0.5 rounded-full border border-slate-700
                    bg-slate-800/60 text-slate-400 text-[10px] font-semibold uppercase tracking-wider"
                tags={write.tasks
                    ?.filter((task) => task.taskType)
                    .map((task, index) => ({
                        key: index,
                        label: `T${index + 1}: ${TASK_TYPE_LABELS[task.taskType as TaskType]}`,
                    }))}
            />

            {/* Band score + "Free" badges are unique to Write, so they live here rather than in ItemBody */}
            <div className="flex flex-wrap gap-1.5 -mt-1.5">
                {write.overallBand != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-teal-700/50
                        bg-teal-950/30 text-teal-300 text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle2 size={9} /> Band {write.overallBand}
                    </span>
                )}
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-slate-700
                    bg-slate-800/60 text-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                    <Gift size={9} /> Free
                </span>
            </div>
            
            <ItemFooter
                status={write.status}
                busy={busy}
                onPublish={() => onPublish(write._id)}
                onArchive={() => onArchive(write._id)}
                onEdit={() => onEdit(write)}
                onDelete={() => onDelete(write._id)}
            />
        </ItemCard>
    );
};