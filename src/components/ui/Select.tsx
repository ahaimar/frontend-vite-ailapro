import { type SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, id, options, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-base-content">
                        {label}
                    </label>
                )}
                <select
                    ref={ref}
                    id={id}
                    className={`w-full px-4 py-2.5 bg-slate-900/80 border border-slate-950 rounded-xl text-base-content focus:outline-none focus:border-slate-600 focus:shadow-slate-600 transition-colors cursor-pointer ${className}`}
                    {...props}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && <span className="text-sm text-red-500">{error}</span>}
            </div>
        );
    }
);

Select.displayName = 'Select';
