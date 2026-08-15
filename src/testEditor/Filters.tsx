import React from "react";
import { Search, Filter } from "lucide-react";

import { STATUSES, LEVELS, MET_TYPE, type Status, type Level, type WriteTestType } from "./index.ts";
import { Button, Field, Select } from "../ui/UI";

export interface FiltersValue {
    search?:    string | '';
    status?:    Status | null;
    level?:     Level | null;
    type?:      WriteTestType | null;
}

interface FiltersProps {
    value: FiltersValue;
    onChange: (next: FiltersValue) => void;

    showSearch?: boolean;
    showStatus?: boolean;
    showLevel?: boolean;
    showType?: boolean;

    searchPlaceholder?: string;
    className?: string;
}

export const Filters: React.FC<FiltersProps> = ({
    value,
    onChange,
    showSearch = true,
    showStatus = true,
    showLevel = false,
    showType = false,
    searchPlaceholder = "Search by title…",
    className = "",
}) => {
    const patch = (next: Partial<FiltersValue>) => onChange({ ...value, ...next });

    const hasActiveFilters = Boolean(
        value.status && value.status !== null
        || value.level
        || value.type
        || value.search,
    );

    const clearAll = () => onChange({
        search: showSearch ? "" : value.search,
        status: showStatus ? null : value.status,
        level: showLevel ? null : value.level,
        type: showType ? null : value.type,
    });

    return (
        <div className={`grid grid-cols-1 gap-3 items-start sm:items-end flex-wrap bg-slate-900 border border-slate-700/60 rounded-2xl p-4 ${className}`}>
            <div className="flex justify-between items-center ">
                <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mr-1">
                    <Filter size={13} />
                    Filters
                </div>  
                <div className="flex gap-2">
                    {hasActiveFilters && (
                        <Button
                            label="Clear"
                            variant="sand"
                            onClick={clearAll}
                        />
                    )}
                    {showSearch && (
                        <div className="relative flex-1 min-w-45">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={value.search ?? ""}
                                onChange={(e) => patch({ search: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-4
                                        text-sm text-slate-200 placeholder-slate-500 focus:outline-none
                                        focus:ring-2 ring-emerald-500/20"
                            />
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex gap justify-between items-center w-full">

                {showStatus && (
                    <Field label="Status" htmlFor="filter-status">
                        <Select
                            id="filter-status"
                            value={value.status ?? "all"}
                            onChange={(e) => patch({ status: e.target.value as Status | null })}
                        >
                            <option value="all">All statuses</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </option>
                            ))}
                        </Select>
                    </Field>
                )}

                {showLevel && (
                    <Field label="Level" htmlFor="filter-level">
                        <Select
                            id="filter-level"
                            value={value.level ?? ""}
                            onChange={(e) => patch({ level: e.target.value as Level | null })}
                        >
                            <option value="">All levels</option>
                            {LEVELS.map((l) => (
                                <option key={l} value={l}>{l}</option>
                            ))}
                        </Select>
                    </Field>
                )}

                {showType && (
                    <Field label="Type" htmlFor="filter-type">
                        <Select
                            id="filter-type"
                            value={value.type ?? ""}
                            onChange={(e) => patch({ type: e.target.value as WriteTestType | null })}
                        >
                            <option value="">All types</option>
                            {MET_TYPE.map((t) => (
                                <option key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                </option>
                            ))}
                        </Select>
                    </Field>
                )}
                
            </div>
        </div>
    );
};


export default Filters;