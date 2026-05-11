// src/services/authService.ts

export interface User {
    id: string;
    username: string;
    avatar?: string;
    created_at?: string;
    last_login?: string;
}

export interface SignUpData {
    username: string;
    password: string;
}

export interface SignInData {
    username: string;
    password: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
    private tokenKey = 'dakop_token';
    private userKey = 'dakop_user';

    async signup(data: SignUpData): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signup failed');
        }

        const result = await response.json();
        this.setSession(result.token, result.user);
        return result;
    }

    async signin(data: SignInData): Promise<AuthResponse> {
        const response = await fetch(`${API_URL}/auth/signin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Signin failed');
        }

        const result = await response.json();
        this.setSession(result.token, result.user);
        return result;
    }

    async getMe(token: string): Promise<User> {
        const response = await fetch(`${API_URL}/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get user data');
        }

        return response.json();
    }

    setSession(token: string, user: User): void {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    getUser(): User | null {
        const userStr = localStorage.getItem(this.userKey);
        if (!userStr) return null;
        try {
            return JSON.parse(userStr);
        } catch {
            return null;
        }
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    getAuthHeader(): { Authorization: string } | {} {
        const token = this.getToken();
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    }
}

export const authService = new AuthService();
// Also export the class if needed
export { AuthService };