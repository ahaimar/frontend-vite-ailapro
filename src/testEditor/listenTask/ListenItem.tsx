import type React from "react";
import { FileText } from "lucide-react";
import {
    type ListenListItem,
    type ListenTest,
    QUESTION_TYPE_LABELS,
} from "./listenDTO.ts";
import { ItemBody, ItemCard, ItemFooter, ItemHeader } from "../ItemsControl";

interface ListenItemProps {
    listen: ListenListItem;
    onEdit: (listen: ListenTest) => void;
    onDelete: (id: string) => Promise<void>;
    onPublish: (item: ListenListItem) => Promise<void>;
    onArchive: (item: ListenListItem) => Promise<void>;
    busy: boolean;
}

const ListenItem: React.FC<ListenItemProps> = ({
    listen,
    onEdit,
    onDelete,
    onPublish,
    onArchive,
    busy,
}) => {
    const passageCount = listen.passages?.length ?? 0;
    const totalQuestions = listen.stats?.totalQuestions ?? 0;

    return (
        <ItemCard status={listen.status}>
            <ItemHeader title={listen.title} status={listen.status} icon={<FileText size={20} />} />

            <ItemBody
                metas={[
                    {
                        key: "passages",
                        label: `${passageCount} passage${passageCount !== 1 ? "s" : ""}`,
                    },
                    ...(listen.metadata?.estimatedDuration
                        ? [{ key: "duration", label: `${listen.metadata.estimatedDuration} min` }]
                        : []),
                    ...(listen.metadata?.topic ? [{ key: "topic", label: listen.metadata.topic }] : []),
                ]}
                description={listen.description}
                tags={listen.passages?.map((passage, idx) => {
                    // field is questions[0]?.formType (was sec.body[0]?.formType in the read card)
                    const firstType = passage.questions?.[0]?.formType ?? "mcq";
                    return {
                        key: idx,
                        label: `Passage ${passage.partNumber} · ${QUESTION_TYPE_LABELS[firstType]}`,
                    };
                })}
            />

            {/* total-questions footnote is unique to Listen, so it stays local rather than in ItemBody */}
            {totalQuestions > 0 && (
                <p className="text-[10px] text-slate-600 font-semibold">
                    {totalQuestions} question{totalQuestions !== 1 ? "s" : ""}
                </p>
            )}

            <ItemFooter
                status={listen.status}
                busy={busy}
                onPublish={() => onPublish({ _id: listen?._id } as ListenListItem)}
                onArchive={() => onArchive({ _id: listen?._id } as ListenListItem)}
                onEdit={() => onEdit(listen as ListenTest)}
                onDelete={() => listen._id && onDelete(listen._id)}
            />
        </ItemCard>
    );
};

export default ListenItem;