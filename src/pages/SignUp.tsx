// src/pages/SignUp.tsx
import React from 'react';
import api from '../api/axios';
import type { RegisterResponse } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../schemas/auth';
import GoogleSignIn from "../components/GoogleSignIn.tsx";
import { Header } from "../ui/Header.tsx";

export const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: { email: '', password: '', confirm: '' },
    });

    const onSubmit = async (values: RegisterInput) => {
        try {
            const resp = await api.post<RegisterResponse>('/api/auth/register', {
                email: values.email,
                password: values.password,
            });
            login(resp.data.token, resp.data.user);
            navigate('/', { replace: true });
        } catch (err: any) {
            const message = err?.response?.data?.message ?? 'Registration failed.';
            alert(message)
        }
    }
    return (
        <div className="min-h-screen bg-[#f8fbf9] dark:bg-neutral-900 bg-[linear-gradient(to_right,#e5f5eb_1px,transparent_1px),linear-gradient(to_bottom,#e5f5eb_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[24px_24px] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            <div className="w-full max-w-md mx-auto">
                <Header title={<span className="text-3xl font-bold tracking-tight text-gray-800">SealVault</span>} subtitle="Join Us" variant="auth" />
                <div className="p-6 sm:p-8 bg-white/20 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-white/60 dark:border-white/10 shadow-2xl mt-4 transition-colors duration-300">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Create account</h2>

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
                                    autoComplete="new-password"
                                    required
                                    error={errors.password?.message ?? null}
                                />
                            )}
                        />

                        <Controller
                            control={control}
                            name="confirm"
                            render={({ field }) => (
                                <Input
                                    label="Confirm password"
                                    {...field}
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    error={errors.confirm?.message ?? null}
                                />
                            )}
                        />

                        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 mt-4 sm:mt-6">
                            <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full sm:w-auto">
                                {isSubmitting ? 'Creating…' : 'Create account'}
                            </Button>

                            <div className="text-sm text-gray-600 dark:text-gray-300 transition-colors duration-300">
                                <span>Already have an account? </span>
                                <Link to="/login" className="text-teal-600 dark:text-teal-400 hover:underline">
                                    Sign In
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
                        <GoogleSignIn onSuccess={() => navigate('/')} />
                    </div>
                </div>
            </div>
        </div>
    );
};