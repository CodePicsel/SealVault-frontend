// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import type { User } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

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
            navigate('/', { replace: true });
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
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Sign in</h2>

            <form onSubmit={handleSubmit} noValidate>
                <Input
                    label="Email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                />

                <Input
                    label="Password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />

                {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

                <div className="flex items-center justify-between">
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign in'}
                    </Button>

                    <div className="text-sm text-gray-600">
                        <span>Don't have an account? </span>
                        <Link to="/signup" className="text-teal-600 hover:underline">Create one</Link>
                    </div>
                </div>
            </form>
        </div>
    );
};