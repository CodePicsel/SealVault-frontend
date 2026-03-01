// src/components/GoogleSignIn.tsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

declare global {
    interface Window { google?: any; }
}

type Props = {
    onSuccess?: () => void;
    buttonText?: string;
};

const GoogleSignIn: React.FC<Props> = ({ onSuccess, buttonText = 'Sign in with Google' }) => {
    const { login } = useAuth();
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [gsiReady, setGsiReady] = useState<boolean | null>(null); // null=unknown, true=rendered, false=fallback
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let didCancel = false;
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.warn('VITE_GOOGLE_CLIENT_ID missing');
            setGsiReady(false);
            return;
        }

        function onGsiLoad() {
            try {
                if (!window.google || !window.google.accounts || !containerRef.current) {
                    setGsiReady(false);
                    return;
                }
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleCredentialResponse,
                    ux_mode: 'popup',
                });

                // try to render the branded button
                try {
                    window.google.accounts.id.renderButton(containerRef.current, {
                        theme: 'outline',
                        size: 'large',
                        width: 240,
                    });
                    setGsiReady(true);
                } catch (err) {
                    console.warn('GSI render failed, will use fallback button', err);
                    setGsiReady(false);
                }
            } catch (e) {
                console.error('GSI init error', e);
                setGsiReady(false);
            }
        }

        if (window.google && window.google.accounts) {
            onGsiLoad();
        } else {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (!didCancel) onGsiLoad();
            };
            script.onerror = (e) => {
                console.error('Failed to load GSI script', e);
                setGsiReady(false);
            };
            document.head.appendChild(script);
        }

        return () => {
            didCancel = true;
        };
    }, []);

    async function handleCredentialResponse(resp: any) {
        setBusy(true);
        try {
            const id_token = resp?.credential;
            if (!id_token) throw new Error('No credential returned by Google');
            const backendResp = await api.post('/api/auth/google', { id_token });
            const token = backendResp.data?.token;
            const user = backendResp.data?.user;
            if (!token || !user) throw new Error('No token/user returned by backend');
            login(token, user);
            onSuccess?.();
        } catch (err: any) {
            console.error('Google sign-in failed', err);
            alert(err?.response?.data?.message ?? err.message ?? 'Google sign-in failed');
        } finally {
            setBusy(false);
        }
    }

    // manual fallback click: prompt/one-tap popup
    const handleFallback = () => {
        if (window.google && window.google.accounts && window.google.accounts.id) {
            // prompt() will show the One Tap or re-prompt flow; using prompt() is optional.
            window.google.accounts.id.prompt();
            return;
        }
        // last resort - open popup? not necessary; show message
        alert('Google Sign-In not available (script failed to load).');
    };

    return (
        <div>
            <div ref={containerRef} />
            {gsiReady === null && <div className="mt-2 text-sm text-gray-500">Loading Google sign-in…</div>}
            {gsiReady === false && (
                <div style={{ marginTop: 8 }}>
                    <button
                        type="button"
                        onClick={handleFallback}
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        disabled={busy}
                    >
                        {busy ? 'Working…' : buttonText}
                    </button>
                </div>
            )}
        </div>
    );
};

export default GoogleSignIn;