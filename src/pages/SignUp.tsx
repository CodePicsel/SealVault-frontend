// src/pages/SignUp.tsx
import React, { useState } from 'react';
import api from '../api/axios';
import type { RegisterRequest, RegisterResponse } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

const validateEmail = (email: string) => /\S+@\S+\.\S+/.test(email);

export const SignUp: React.FC = () => {
    const navigate = useNavigate();
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

            // Save token + user
            login(resp.data.token, resp.data.user);

            // redirect
            navigate('/', { replace: true });
        } catch (err: any) {
            if (err?.response?.data?.message) setError(err.response.data.message);
            else if (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.length) setError(err.response.data.errors[0].msg);
            else setError('Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Create account</h2>

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
                    autoComplete="new-password"
                    required
                />

                <Input
                    label="Confirm password"
                    name="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                />

                {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

                <div className="flex items-center justify-between">
                    <Button type="submit" disabled={loading} variant="primary">
                        {loading ? 'Creating…' : 'Create account'}
                    </Button>

                    <div className="text-sm text-gray-600">
                        <span>Already have an account? </span>
                        <Link to="/login" className="text-teal-600 hover:underline">Sign In</Link>
                    </div>
                </div>
            </form>
        </div>
    );
};