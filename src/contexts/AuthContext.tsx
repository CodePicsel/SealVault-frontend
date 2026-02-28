// src/contexts/AuthContext.tsx
import type { User } from '../types/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/axios';

type AuthState = {
    user: User | null;
    token: string | null;
};

type AuthContextType = AuthState & {
    login: (token: string, user: User) => void;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_TOKEN_KEY = 'token';
const LOCAL_USER_KEY = 'user';

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    });

    const [token, setToken] = useState<string | null>(() => localStorage.getItem(LOCAL_TOKEN_KEY));

    useEffect(() => {
        if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
    }, [token]);

    // try silent refresh on app start (if cookie exists)
    useEffect(() => {
        const init = async () => {
            try {
                // If we already have a token in localStorage, keep it.
                if (!localStorage.getItem(LOCAL_TOKEN_KEY)) {
                    const resp = await api.post('/api/auth/refresh');
                    const newToken = resp.data?.token;
                    const newUser = resp.data?.user;
                    if (newToken) {
                        localStorage.setItem(LOCAL_TOKEN_KEY, newToken);
                        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
                        setToken(newToken);
                        setUser(newUser);
                        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                    }
                } else {
                    // set state from localStorage
                    setToken(localStorage.getItem(LOCAL_TOKEN_KEY));
                    const raw = localStorage.getItem(LOCAL_USER_KEY);
                    if (raw) setUser(JSON.parse(raw));
                }
            } catch {
                // no valid refresh cookie / refresh failed
                localStorage.removeItem(LOCAL_TOKEN_KEY);
                localStorage.removeItem(LOCAL_USER_KEY);
                setToken(null);
                setUser(null);
            }
        };
        init();
    }, []);

    const login = (newToken: string, newUser: User) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem(LOCAL_TOKEN_KEY, newToken);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    };

    const logout = async () => {
        try {
            await api.post('/api/auth/logout').catch(() => {});
        } catch { console.error('Unable to log in.'); }
        setUser(null);
        setToken(null);
        localStorage.removeItem(LOCAL_TOKEN_KEY);
        localStorage.removeItem(LOCAL_USER_KEY);
        delete api.defaults.headers.common.Authorization;
    };

    return <AuthContext.Provider value={{ user, token, login, logout }}>{children}</AuthContext.Provider>;
};
export default AuthProvider

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within the AuthProvider');
    return ctx;
}