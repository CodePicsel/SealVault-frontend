// src/pages/SignUp.tsx
import React, { useState } from 'react';
import api from '../api/axios';
import type { RegisterRequest, RegisterResponse } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export const SignUp: React.FC = () => {
    const navigate = useNavigate();   // ✅ MUST be inside component
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateEmail(email)) return setError('Please enter a valid email.');
        if (password.length < 8) return setError('Password must be at least 8 characters.');
        if (password !== confirm) return setError('Passwords do not match.');

        const payload: RegisterRequest = { email, password };

        try {
            setLoading(true);
            const resp = await api.post<RegisterResponse>('/api/auth/register', payload);

            login(resp.data.token, resp.data.user);

            // redirect AFTER login
            navigate('/', { replace: true });

        } catch (err: any) {
            if (err?.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Registration failed.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480, margin: '2rem auto' }}>
            <h2>Create account</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Email
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                        autoComplete="email"
                    />
                </label>

                <label>
                    Password
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                        minLength={8}
                    />
                </label>

                <label>
                    Confirm password
                    <input
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        type="password"
                        required
                        minLength={8}
                    />
                </label>

                {error && <div style={{ color: 'crimson' }}>{error}</div>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating…' : 'Create account'}
                </button>

                <div style={{ marginTop: 12 }}>
                    <span>Already have an account? </span>
                    <Link to="/login">Sign In</Link>
                </div>
            </form>
        </div>
    );
};