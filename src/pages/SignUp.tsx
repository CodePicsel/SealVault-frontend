// src/pages/SignUp.tsx
import React, { useState } from 'react';
import api from '../api/axios';
import type { RegisterRequest, RegisterResponse } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export const SignUp: React.FC = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Client-side validation (basic)
        if (!validateEmail(email)) return setError('Please enter a valid email.');
        if (password.length < 8) return setError('Password must be at least 8 characters.');
        if (password !== confirm) return setError('Passwords do not match.');

        const payload: RegisterRequest = { email, password };

        try {
            setLoading(true);
            const resp = await api.post<RegisterResponse>('/api/auth/register', payload);
            // Save token + user via context
            login(resp.data.token, resp.data.user);
            setSuccess('Account created — you are now logged in.');
            setEmail('');
            setPassword('');
            setConfirm('');
        } catch (err: any) {
            // Try to parse server validation errors
            if (err?.response) {
                const data = err.response.data;
                // server uses { errors: [...] } or { message: '...' }
                if (Array.isArray(data?.errors) && data.errors.length > 0) {
                    setError(data.errors[0].msg || JSON.stringify(data.errors[0]));
                } else if (data?.message) {
                    setError(data.message);
                } else {
                    setError('Registration failed. Please try again.');
                }
            } else {
                setError('Network error. Check your connection or server.');
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
                        autoComplete="new-password"
                        style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                        minLength={8}
                    />
                </label>

                <label style={{ marginTop: 12, display: 'block' }}>
                    Confirm password
                    <input
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        type="password"
                        required
                        autoComplete="new-password"
                        style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
                        minLength={8}
                    />
                </label>

                {error && <div style={{ color: 'crimson', marginTop: 12 }}>{error}</div>}
                {success && <div style={{ color: 'green', marginTop: 12 }}>{success}</div>}

                <button
                    type="submit"
                    disabled={loading}
                    style={{ marginTop: 16, padding: '10px 16px' }}
                >
                    {loading ? 'Creating…' : 'Create account'}
                </button>
            </form>
        </div>
    );
};