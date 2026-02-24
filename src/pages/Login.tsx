// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import type { User } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

type LoginResponse = { token: string; user: User };

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) return setError('Email and password are required.');

        try {
            setLoading(true);
            const resp = await api.post<LoginResponse>('/api/auth/login', { email, password });
            login(resp.data.token, resp.data.user);
            navigate('/', { replace: true }); // go to home or dashboard
        } catch (err: any) {
            if (err?.response) {
                const data = err.response.data;
                if (Array.isArray(data?.errors) && data.errors.length) setError(data.errors[0].msg);
                else if (data?.message) setError(data.message);
                else setError('Login failed.');
            } else {
                setError('Network error.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, margin: '2rem auto' }}>
            <h2>Sign in</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        autoComplete="email"
                        style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                    />
                </label>

                <label style={{ marginTop: 12, display: 'block' }}>
                    Password
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        autoComplete="current-password"
                        style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                    />
                </label>

                {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ marginTop: 16, padding: '10px 16px' }}>
                    {loading ? 'Signing in…' : 'Sign in'}
                </button>

                <div style={{ marginTop: 12 }}>
                    <span>Don't have an account? </span>
                    <Link to="/signup">Create one</Link>
                </div>
            </form>
        </div>
    );
};