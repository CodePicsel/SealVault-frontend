import type {User} from "../types/auth.ts";
import {createContext, useContext, useEffect, useState} from "react";
import api from "../api/axios.ts";

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

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(()=>{
        const raw = localStorage.getItem(LOCAL_USER_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    });
    const [token, setToken] = useState<string | null>(()=>localStorage.getItem(LOCAL_TOKEN_KEY));
    useEffect(() => {
        if(token){
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        }else{
            delete api.defaults.headers.common.Authorization;
        }
    }, [token]);
    const login = (newToken: string, newUser: User) => {
        setUser(newUser);
        setToken(newToken);
        localStorage.setItem(LOCAL_TOKEN_KEY, newToken);
        localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(newUser));
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
    };
    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem(LOCAL_TOKEN_KEY);
        localStorage.removeItem(LOCAL_USER_KEY);
        delete api.defaults.headers.common.Authorization;
    };
    return (
        <AuthContext.Provider value={{user, token, login, logout}}>
            {children}
        </AuthContext.Provider>
    );
};
export function useAuth():AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within the AuthProvider");
    return ctx;
}