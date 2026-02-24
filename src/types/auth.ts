export interface User{
    id: string;
    email: string;
}

export interface RegisterRequest{
    email: string;
    password: string;
}
export interface RegisterResponse{
    token: string;
    user: User;
}