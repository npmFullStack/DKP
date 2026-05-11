// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/services/authService';
import type { User, SignUpData, SignInData } from '@/services/authService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    signup: (data: SignUpData) => Promise<void>;
    signin: (data: SignInData) => Promise<void>;
    logout: () => void;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing session on mount
        const initAuth = async () => {
            const token = authService.getToken();
            const savedUser = authService.getUser();

            if (token && savedUser) {
                try {
                    // Verify token is still valid
                    const userData = await authService.getMe(token);
                    setUser(userData);
                } catch (err) {
                    // Token is invalid, clear session
                    console.error('Session validation failed:', err);
                    authService.logout();
                    setUser(null);
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const signup = async (data: SignUpData) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await authService.signup(data);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Signup failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signin = async (data: SignInData) => {
        setError(null);
        setIsLoading(true);
        try {
            const response = await authService.signin(data);
            setUser(response.user);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Signin failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        signup,
        signin,
        logout,
        error,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};