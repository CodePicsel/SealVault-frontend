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
                        width: 320,
                        shape: 'pill'
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
        <div className="relative group w-full flex justify-center">
            {/* Custom Aesthetic Button */}
            <button
                type="button"
                onClick={handleFallback}
                className="w-full max-w-[320px] flex items-center justify-center gap-3 px-6 py-2.5 bg-white/40 dark:bg-neutral-800/60 hover:bg-white/70 dark:hover:bg-neutral-700/60 backdrop-blur-md rounded-xl border border-white/80 dark:border-white/10 shadow-sm transition-all duration-300 text-teal-950 dark:text-teal-100 font-semibold tracking-wide hover:shadow-[0_4px_20px_-2px_rgba(45,212,191,0.3)] dark:hover:shadow-[0_4px_20px_-2px_rgba(45,212,191,0.2)]"
            >
                <svg className="w-5 h-5 drop-shadow-sm" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {busy ? 'Working…' : buttonText}
            </button>

            {/* Invisible Google Overlay passing clicks exactly on top of the pill */}
            <div className="absolute inset-0 w-full h-full flex justify-center opacity-[0.01] overflow-hidden z-10" style={{ pointerEvents: 'auto' }}>
                <div ref={containerRef} className="w-[320px] scale-y-[1.4] scale-x-105 origin-center" />
            </div>

            {gsiReady === null && <div className="absolute -bottom-6 text-xs text-gray-500">Loading Google sign-in…</div>}
        </div>
    );
};

export default GoogleSignIn;