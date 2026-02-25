// src/pages/Login.tsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { loginSchema, type LoginInput } from '../schemas/auth';
import type { User } from '../types/auth';
type LoginResponse = { token: string; user: User };

export const Login: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = async (values: LoginInput) => {
        try {
            const resp = await api.post<LoginResponse>('/api/auth/login', {
                email: values.email,
                password: values.password,
            });
            login(resp.data.token, resp.data.user);
            navigate('/', { replace: true });
        } catch (err: any) {
            const message = err?.response?.data?.message ?? 'Login failed';
            alert(message);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Sign in</h2>

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

                <div className="flex items-center justify-between mt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Signing in…' : 'Sign in'}
                    </Button>

                    <div className="text-sm text-gray-600">
                        <span>Don't have an account? </span>
                        <Link to="/signup" className="text-teal-600 hover:underline">
                            Create one
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};