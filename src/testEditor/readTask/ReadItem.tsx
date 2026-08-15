import type React from "react";
import { Settings, FileText } from "lucide-react";
import { QUESTION_TYPE_LABELS, type ReadListItem, type ReadTest } from "./readDTO.ts";
import { ItemBody, ItemCard, ItemFooter, ItemHeader } from "../ItemsControl.tsx";

interface ReadItemProps {
    read: ReadListItem;
    onEdit: (read: ReadTest) => void;
    onDelete: (id: string) => Promise<void>;
    onPublish: (item: ReadListItem) => Promise<void>;
    onArchive: (item: ReadListItem) => Promise<void>;
    busy: boolean;
}

const ReadItem: React.FC<ReadItemProps> = ({ read, onEdit, onDelete, onPublish, onArchive, busy }) => {
    return (
        <ItemCard status={read.status}>
            <ItemHeader title={read.title} status={read.status} icon={<FileText size={20} />} />

            <ItemBody
                metas={[
                    {
                        key: "sections",
                        icon: <Settings size={11} />,
                        label: `${read.sections?.length ?? 0} Sections`,
                    },
                    ...(read.metadata?.estimatedDuration
                        ? [{ key: "duration", label: `${read.metadata.estimatedDuration} mins` }]
                        : []),
                    ...(read.metadata?.topic ? [{ key: "topic", label: read.metadata.topic }] : []),
                    ...(read.metadata?.type ? [{ key: "type", label: read.metadata.type }] : []),
                ]}
                description={read.description}
                tags={read.sections?.map((sec, idx) => ({
                    key: idx,
                    label: QUESTION_TYPE_LABELS[sec.body[0]?.formType ?? "short_answer"],
                }))}
            />

            <ItemFooter
                status={read.status}
                busy={busy}
                onPublish={() => onPublish({ _id: read?._id } as ReadListItem)}
                onArchive={() => onArchive({ _id: read?._id } as ReadListItem)}
                onEdit={() => onEdit(read as ReadTest)}
                onDelete={() => read._id && onDelete(read._id)}
            />
        </ItemCard>
    );
};

export default ReadItem;