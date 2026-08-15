import {useEffect, useRef} from "react";

// Minimal typings for the Google Identity Services global injected by the
// <script src="https://accounts.google.com/gsi/client"> tag in index.html.
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (resp: { credential: string }) => void;
                    }) => void;
                    renderButton: (
                        parent: HTMLElement,
                        options: Record<string, unknown>
                    ) => void;
                };
            };
        };
    }
}

type Props = {
    /** Called with the Google ID token when the user finishes sign-in. */
    onCredential: (credential: string) => void;
    /** "signin_with" | "signup_with" | "continue_with" — button caption. */
    text?: "signin_with" | "signup_with" | "continue_with";
};

// const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

const CLIENT_ID = "255840172800-gbetv4stf8um65d6fsm1e5ds5up40c47.apps.googleusercontent.com" as string | undefined;

export default function GoogleSignInButton({onCredential, text = "continue_with"}: Props) {
    const divRef = useRef<HTMLDivElement>(null);
    // Keep the latest callback without re-initializing on every render.
    const cbRef = useRef(onCredential);
    // cbRef.current = onCredential;
    useEffect(() => {
        cbRef.current = onCredential;
    }, [onCredential]);

    useEffect(() => {
        if (!CLIENT_ID) {
            console.error("VITE_GOOGLE_CLIENT_ID is not set — Google button disabled.");
            return;
        }

        let cancelled = false;

        // The GSI script loads async; poll briefly until window.google exists.
        const tryRender = () => {
            if (cancelled) return;
            const g = window.google;
            if (!g || !divRef.current) {
                window.setTimeout(tryRender, 100);
                return;
            }
            g.accounts.id.initialize({
                client_id: CLIENT_ID,
                callback: (resp) => cbRef.current(resp.credential),
            });
            g.accounts.id.renderButton(divRef.current, {
                theme: "filled_black",
                size: "large",
                text,
                shape: "pill",
                width: 320,
                logo_alignment: "center",
            });
        };
        tryRender();

        return () => {
            cancelled = true;
        };
    }, [text]);

    if (!CLIENT_ID) return null;

    return <div ref={divRef} className="flex justify-center"/>; // can ui improve ?
}