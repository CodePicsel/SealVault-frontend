// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { loginSchema, type LoginInput } from '../schemas/auth';
import type { User } from '../types/auth';
import GoogleSignIn from "../components/GoogleSignIn.tsx";
import { Header } from "../ui/Header.tsx";

type LoginResponse = { token: string; user: User };

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const from = location.state?.from?.pathname
        ? location.state.from.pathname + (location.state.from.search || '')
        : '/';

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (values: LoginInput) => {
        setErrorMessage(null);
        try {
            const resp = await api.post<LoginResponse>('/api/auth/login', {
                email: values.email,
                password: values.password,
            });
            // successful login
            login(resp.data.token, resp.data.user);
            navigate(from, { replace: true });
        } catch (err: any) {
            // network / CORS / timeout
            if (err?.isNetwork || err?.code === 'ECONNABORTED') {
                console.error('Network / CORS / timeout error', err);
                setErrorMessage('Network error or server unreachable. Check your connection or CORS settings.');
                return;
            }

            const status = err?.status ?? err?.response?.status;
            const serverMsg = err?.data?.message ?? err?.response?.data?.message ?? null;

            if (status === 401) {
                // Invalid credentials
                setErrorMessage('Invalid email or password.');
            } else if (status === 400 && typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('google')) {
                // Helpful guidance when server tells to use Google
                setErrorMessage(serverMsg);
            } else {
                console.error('Login error response:', err?.response ?? err);
                setErrorMessage(serverMsg ?? 'Login failed. Please try again.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fbf9] dark:bg-neutral-900 bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[24px_24px] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="w-full max-w-md mx-auto">
                <Header title={<span className="text-3xl sm:text-4xl text-[#2c4c3b] dark:text-teal-50 font-extrabold tracking-tighter transition-colors duration-700 drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">SealVault</span>} subtitle="Welcome back" variant="auth" />
                <div className="p-6 sm:p-8 bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl mt-4 transition-colors duration-300">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Sign in</h2>

                    {errorMessage && (
                        <div className="mb-4 p-3 text-sm bg-rose-50 text-rose-800 border border-rose-100 rounded">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} noValidate>
                        <Controller
                            control={control}
                            name="email"
                            render={({ field }) => (
                                <Input
                                    label="Email"
                                    {...field}
                                    type="email"
                                    autoComplete="email"
                                    required
                                    error={errors.email?.message ?? null}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="password"
                            render={({ field }) => (
                                <Input
                                    label="Password"
                                    {...field}
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    error={errors.password?.message ?? null}
                                />
                            )}
                        />

                        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mt-4 sm:mt-6">
                            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                                {isSubmitting ? 'Signing in…' : 'Sign in'}
                            </Button>

                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                <span>Don't have an account? </span>
                                <Link to="/signup" className="text-teal-600 dark:text-teal-400 hover:underline">
                                    Create one
                                </Link>
                            </div>
                        </div>
                    </form>

                    <div className="mt-8">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/60 dark:border-white/10 transition-colors duration-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-3 bg-transparent text-gray-600 dark:text-gray-400 font-medium transition-colors duration-300">Or continue with</span>
                            </div>
                        </div>
                        <GoogleSignIn onSuccess={() => navigate(from, { replace: true })} />
                    </div>
                </div>
            </div>
        </div>
    );
};