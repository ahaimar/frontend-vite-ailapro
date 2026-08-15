import { useCallback, useEffect, useState } from "react";
import { userService } from "../../context/authService.ts";
import type { TestCorrectionData } from "./testCorrection.types.ts";

interface UseTestCorrectionOptions {
    auto?: boolean;
}

/**
 * Loads a TestCorrection document by testRef via userService.getTestCorrection.
 *
 * Handles two possible shapes from userService, since the exact contract
 * of the service layer wasn't specified:
 *   1. userService already returns parsed JSON (e.g. { data: {...} } or the raw object)
 *   2. userService returns a raw fetch Response (has .ok / .json())
 *
 * If your userService.getTestCorrection has a known, fixed return shape,
 * you can delete the branch you don't need below.
 */
export function useTestCorrection(
    testRef: string | undefined,
    { auto = true }: UseTestCorrectionOptions = {}
) {
    const [data, setData] = useState<TestCorrectionData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTest = useCallback(async () => {
        if (!testRef) return;

        setLoading(true);
        setError(null);

        try {
            const result = await userService.getTestCorrection(testRef);

            const isRawResponse =
                typeof result === "object" &&
                result !== null &&
                "ok" in result &&
                typeof (result as Response).json === "function";

            let json: unknown;
            if (isRawResponse) {
                const res = result as Response;
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(
                        (body as { message?: string })?.message ||
                            `Request failed with status ${res.status}`
                    );
                }
                json = await res.json();
            } else {
                json = result;
            }

            const payload = (json as { data?: TestCorrectionData })?.data ?? (json as TestCorrectionData);
            setData(payload ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load test correction");
            setData(null);
        } finally {
            setLoading(false);
        }
    }, [testRef]);

    useEffect(() => {
        if (auto) fetchTest();
    }, [fetchTest, auto]);

    return { data, loading, error, refetch: fetchTest };
}