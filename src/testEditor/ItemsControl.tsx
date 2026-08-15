import type React from "react";
import type { ReactNode } from "react";
import { Archive, Loader2, Pencil, Send, Trash2 } from "lucide-react";
import { Button, Item } from "../ui/UI";

/* ------------------------------------------------------------------ */
/*  Shared status helpers                                              */
/*  (previously copy-pasted as getStatusBarColor in every *Item.tsx)   */
/* ------------------------------------------------------------------ */

export type ItemStatus = "draft" | "published" | "completed" | string;

const STATUS_BAR_CLASSES: Record<string, string> = {
    published: "bg-gradient-to-r from-emerald-500 to-teal-400",
    draft: "bg-gradient-to-r from-indigo-500 to-violet-500",
    completed: "bg-gradient-to-r from-teal-400 to-indigo-500",
};

// eslint-disable-next-line react-refresh/only-export-components
export const getStatusBarColor = (status?: ItemStatus): string =>
    (status && STATUS_BAR_CLASSES[status]) || "bg-slate-700";

const getStatusBadgeColor = (status?: ItemStatus): "emerald" | "amber" | "secondary" =>
    status === "published" ? "emerald" : status === "draft" ? "amber" : "secondary";

/* ------------------------------------------------------------------ */
/*  ItemCard — the outer shell (status bar + padding wrapper)          */
/* ------------------------------------------------------------------ */

interface ItemCardProps {
    status?: ItemStatus;
    children: ReactNode;
}

export const ItemCard: React.FC<ItemCardProps> = ({ status, children }) => (
    <div
        className="group bg-slate-900 border border-slate-700/60 rounded-2xl overflow-hidden
                    shadow-lg hover:border-indigo-500/40 hover:shadow-indigo-900/20 transition-all duration-200"
    >
        <div className={`h-0.5 ${getStatusBarColor(status)}`} />
        <div className="p-5 flex flex-col gap-3">{children}</div>
    </div>
);

/* ------------------------------------------------------------------ */
/*  ItemHeader — icon box (optional) + title + status badge            */
/* ------------------------------------------------------------------ */

interface ItemHeaderProps {
    title?: string;
    fallbackTitle?: string;
    status?: ItemStatus;
    /** Read/Listen use a leading FileText icon box; Write/Speak don't. Pass it in if needed. */
    icon?: ReactNode;
}

export const ItemHeader: React.FC<ItemHeaderProps> = ({
    title,
    fallbackTitle = "Untitled",
    status,
    icon,
}) => (
    <div className="flex items-start gap-3">
        {icon && (
            <div
                className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center
                            text-slate-400 group-hover:text-emerald-400 transition-colors shrink-0"
            >
                {icon}
            </div>
        )}
        <h3 className="text-sm font-bold text-slate-100 leading-snug flex-1 line-clamp-2">
            {title || fallbackTitle}
        </h3>
        {status && <Item text={status} color={getStatusBadgeColor(status)} />}
    </div>
);

/* ------------------------------------------------------------------ */
/*  ItemBody — meta row + description + tag chips                      */
/*  Each caller just supplies its own list of metas/tags; no more      */
/*  per-type hardcoded "Tasks" / "Passages" / "Parts" branches here.    */
/* ------------------------------------------------------------------ */

export interface MetaEntry {
    key: React.Key;
    icon?: ReactNode;
    label: ReactNode;
}

export interface TagEntry {
    key: React.Key;
    label: ReactNode;
}

interface ItemBodyProps {
    description?: string;
    metas?: MetaEntry[];
    tags?: TagEntry[];
    /** override the tag chip style if a card needs a different look (e.g. pill vs rounded) */
    tagClassName?: string;
}

const DEFAULT_TAG_CLASS =
    "text-[10px] font-semibold bg-slate-950 border border-slate-800 px-2 py-1 rounded text-slate-500 capitalize";

export const ItemBody: React.FC<ItemBodyProps> = ({
    description,
    metas,
    tags,
    tagClassName = DEFAULT_TAG_CLASS,
}) => (
    <>
        {metas && metas.length > 0 && (
            <div className="flex items-center gap-3 mt-1 flex-wrap">
                {metas.map((m) => (
                    <span key={m.key} className="text-xs text-slate-500 flex items-center gap-1">
                        {m.icon}
                        {m.label}
                    </span>
                ))}
            </div>
        )}

        {description && (
            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 w-48 truncate">
                {description}
            </p>
        )}

        {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                    <span key={t.key} className={tagClassName}>
                        {t.label}
                    </span>
                ))}
            </div>
        )}
    </>
);

/* ------------------------------------------------------------------ */
/*  ItemFooter — divider + status-aware action row                     */
/*  Publish/Archive/Edit/Delete logic was identical in all 4 files.    */
/* ------------------------------------------------------------------ */

interface ItemFooterProps {
    status?: ItemStatus;
    busy: boolean;
    onPublish?: () => void;
    onArchive?: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export const ItemFooter: React.FC<ItemFooterProps> = ({
    status,
    busy,
    onPublish,
    onArchive,
    onEdit,
    onDelete,
}) => (
    <>
        <div className="border-t border-slate-700/60 my-1" />
        <div className="w-full flex items-center justify-center">
            <div className="flex items-center gap-2">
                {busy ? (
                    <Loader2 size={14} className="text-slate-500 animate-spin" />
                ) : (
                    <>
                        {status === "draft" && onPublish && (
                            <Button onClick={onPublish} label="Publish" variant="submit" icon={<Send size={10} />} />
                        )}
                        {status === "published" && onArchive && (
                            <Button onClick={onArchive} label="Archive" variant="outline" icon={<Archive />} />
                        )}
                        <Button size="sm" onClick={onEdit} label="Edit" variant="secondary" icon={<Pencil />} />
                        <Button size="sm" onClick={onDelete} icon={<Trash2 />} variant="reset" />
                    </>
                )}
            </div>
        </div>
    </>
);