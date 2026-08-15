export interface LoginPayload {
    email: string;
    password: string;
}

export interface SignupPayload {
    name: string;
    email: string;
    password: string;
}

export interface GuestPayload {
    name: string;
}

export interface AuthResponse {
    success: boolean;
    data?: {
        accessToken: string;
        refreshToken?: string;
        user?: {
            id: string;
            email: string;
            name: string;
        };
    };
    error?: string;
    errors?: string[];
    code?: string;
}

export interface ApiError {
    success: false;
    error?: string;
    errors?: string[];
    code?: string;
}
