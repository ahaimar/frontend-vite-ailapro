import React from "react";
import { AlertCircle, CheckCircle2} from "lucide-react";

interface WordCountBadgeProps {
    count: number;
    min: number;
}

const WordCountBadge: React.FC<WordCountBadgeProps> = ({count, min}) => {
    const met = count >= min;
    return (
        <span className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                met ? "text-success" : "text-base-content/60"
            }`}
        >
            {met ? (
                <CheckCircle2 className="h-4 w-4"/>
            ) : (
                <AlertCircle className="h-4 w-4"/>
            )}
            {count} / {min} words
        </span>
    );
};

export default WordCountBadge;
