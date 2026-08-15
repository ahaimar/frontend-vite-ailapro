import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../ui";
import { userService } from "../../context/authService";
import ModelTestCard from "./ModelTestCard";
import { ModelEmpty, ModelError, ModelSkeleton, type BaseTestListItem, type TestStatus } from "./_shared";

/** Icons reused from the menu tab strip so each grid stays visually tied to its tab */
import WRITE  from "../a1/test icon-27.png";
import LISTEN from "../a1/test icon-25.png";
import READ   from "../a1/test icon-26.png";
import SPEAK  from "../a1/test icon-28.png";

import MENU_LISTEN  from "../a1/test icon-25.png";
import MENU_WRITE  from "../a1/test icon-27.png";
import MENU_READ  from "../a1/test icon-26.png";
import MENU_SPEAK  from "../a1/test icon-28.png";


// ─── Generic fetch hook (one per skill, but logic is identical) ───────────────

function useSkillTests(fetcher: (params: Record<string, string>) => Promise<{ data: BaseTestListItem[] }>) {
    const [tests,   setTests  ] = useState<BaseTestListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error,   setError  ] = useState(false);
    const [filter,  setFilter ] = useState<TestStatus | "all">("published");
    const { show: showToast }   = useToast();
    const showToastRef          = useRef(showToast);
    showToastRef.current        = showToast;

    const load = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const res    = await fetcher((filter !== "all" ? { status: filter } : {}));
            setTests(res.data ?? []);
        } catch {
            setError(true);
            showToastRef.current("Failed to load tests", "ERROR");
        } finally {
            setLoading(false);
        }
    }, [filter, fetcher]);

    useEffect(() => { load(); }, [load]);

    return { tests, loading, error, filter, setFilter, reload: load };
}

// ─── Writing ────────────────────────────────────────────────────────────────

export function WriteMudel() {
    const { tests, loading, error,  reload } =
        useSkillTests(userService.getWriteTask);

    return (
        <div >
            <div className="flex p-2">
                <img src={MENU_WRITE} alt="wirte icon" className="w-10 h-10"/>
                <div className="pl-2">
                    <h1 className="text-base-content capitalize">writing tests</h1>
                    <p className="text-primary capitalize">Strengthen Your IELTS Reading Performance</p>
                </div>
            </div>
            <p className="text-secondary capitalize">Showing {tests.length as number} Writeing .</p>
            {loading ? (
                <ModelSkeleton />
            ) : error ? (
                <ModelError label="Couldn't load writing tests." onRetry={reload} />
            ) : tests.length === 0 ? (
                <ModelEmpty icon="✍️" label="No writing tests match this filter." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tests.map(t => (
                        <ModelTestCard
                            key={t._id}
                            test={t}
                            skillRoute="writing"
                            icon={WRITE}
                            accentClass="text-blue-400"
                            minutes={60}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Listening ──────────────────────────────────────────────────────────────

export function ListenMudel() {
    const { tests, loading, error, reload } =
        useSkillTests(userService.getListenTask);

    return (
        <div>
            <div className="flex p-2">
                <img src={MENU_LISTEN} alt="wirte icon" className="w-10 h-10"/>
                <div className="pl-2">
                    <h1 className="text-base-content capitalize">listening tests</h1>
                    <p className="text-primary capitalize">Strengthen Your IELTS Reading Performance</p>
                </div>
            </div>
            {/*<FilterBar value={filter} onChange={setFilter} accent="text-purple-400" />*/}
            <p className="text-secondary capitalize">Showing {tests.length as number} Listening .</p>
            {loading ? (
                <ModelSkeleton />
            ) : error ? (
                <ModelError label="Couldn't load listening tests." onRetry={reload} />
            ) : tests.length === 0 ? (
                <ModelEmpty icon="🎧" label="No listening tests match this filter." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tests.map(t => (
                        <ModelTestCard
                            key={t._id}
                            test={t}
                            skillRoute="listening"
                            icon={LISTEN}
                            accentClass="text-purple-400"
                            minutes={30}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Reading ────────────────────────────────────────────────────────────────

export function ReadMudel() {
    /*const { tests, loading, error, filter, setFilter, reload } =
        useSkillTests(userService.getReadTest);*/

         const { tests, loading, error, reload } =
        useSkillTests(userService.getReadTest);


    return (
        <div>
            <div className="flex p-2">
                <img src={MENU_READ} alt="wirte icon" className="w-10 h-10"/>
                <div className="pl-2">
                    <h1 className="text-base-content capitalize">reading tests</h1>
                    <p className="text-primary capitalize">Strengthen Your IELTS Reading Performance</p>
                </div>
            </div>
            <p className="text-secondary capitalize">Showing {tests.length as number} Reading .</p>
            {loading ? (
                <ModelSkeleton />
            ) : error ? (
                <ModelError label="Couldn't load reading tests." onRetry={reload} />
            ) : tests.length === 0 ? (
                <ModelEmpty icon="📖" label="No reading tests match this filter." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tests.map(t => (
                        <ModelTestCard
                            key={t._id}
                            test={t}
                            skillRoute="reading"
                            icon={READ}
                            accentClass="text-cyan-400"
                            minutes={60}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Speaking ───────────────────────────────────────────────────────────────
// Speaking has no written "test list" in the same sense — it's an AI-driven
// session. Kept the same shell for consistency, but with a single CTA card
// instead of a fetched grid, since there's nothing to paginate yet.

export function SpeakMudel() {
     const { tests, loading, error, reload } =
        useSkillTests(userService.getSpeakTask);

    return (
        <div className="w-full">

            <div className="flex p-3">
                <img src={MENU_SPEAK} alt="wirte icon" className="w-10 h-10"/>
                <div className="pl-2">
                    <h1 className="text-base-content capitalize">speaking tests</h1>
                    <p className="text-primary capitalize">Strengthen Your IELTS Reading Performance</p>
                </div>
            </div>
            
            <p className="text-secondary capitalize">Showing {tests.length as number} Speaking .</p>
            {loading ? (
                <ModelSkeleton />
            ) : error ? (
                <ModelError label="Couldn't load speaking tests." onRetry={reload} />
            ) : tests.length === 0 ? (
                <ModelEmpty icon="📖" label="No speaking tests match this filter." />
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {tests.map(t => (
                        <ModelTestCard
                            key={t._id}
                            test={t}
                            skillRoute="speaking"
                            icon={SPEAK}
                            accentClass="text-cyan-400"
                            minutes={60}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}