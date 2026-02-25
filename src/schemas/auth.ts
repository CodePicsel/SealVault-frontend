import {z} from 'zod';
export const registerSchema = z.object({
    email: z.string().min(1, { message: 'Email is required' }).email({message: 'Invalid email address'}),
    password: z.string().min(8, { message: 'Password must be at least 8 characters' }),
    confirm: z.string().min(1, { message: 'PLease Confirm your Password' }),
}).refine((data)=>data.password === data.confirm, {
    path: ['confirm'],
    message: 'Password do not match',
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
    email: z.string().min(1, { message: 'Email is required' }).email({message: 'Invalid email address'}),
    password: z.string().min(1, { message: 'Password is required' }),
});

export type LoginInput = z.infer<typeof loginSchema>;