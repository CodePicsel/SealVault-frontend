// src/pages/SignUp.tsx
import api from '../api/axios';
import type { RegisterResponse } from '../types/auth';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import {useForm, Controller} from "react-hook-form";
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '../schemas/auth';

export const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const {
        control,
        handleSubmit,
        formState: {errors, isSubmitting},
    } = useForm<RegisterInput>({
        resolver: zodResolver(registerSchema),
        defaultValues: {email: '', password: '', confirm:''},
    });

    const onSubmit = async (values: RegisterInput) =>{
        try{
            const resp = await api.post<RegisterResponse>('/api/auth/register', {
                email: values.email,
                password: values.password,
            });
            login(resp.data.token, resp.data.user);
            navigate('/', {replace: true});
        }catch(err:any){
            const message = err?.response?.data?.message ?? 'Registration failed.';
            alert(message)
        }
    }
    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Create account</h2>

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

                <div className="flex items-center justify-between mt-4">
                    <Button type="submit" disabled={isSubmitting} variant="primary">
                        {isSubmitting ? 'Creating…' : 'Create account'}
                    </Button>

                    <div className="text-sm text-gray-600">
                        <span>Already have an account? </span>
                        <Link to="/login" className="text-teal-600 hover:underline">
                            Sign In
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};