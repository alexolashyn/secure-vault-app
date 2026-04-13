import React, {useState, useCallback, useMemo, useEffect} from 'react';
import {AuthContext} from '../context/AuthContext';
import {authApi} from '../api/auth';
import type {AuthContextType} from '../context/AuthContext';
import type {User} from '../types/auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    const login = useCallback(async (token: string) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        try {
            const {details} = await authApi.getProfile();
            setUser(details);
        } catch (error) {
            console.log(error);
            logout();
        }
    }, [logout]);

    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const {details} = await authApi.getProfile();
                    setUser(details);
                    setIsAuthenticated(true);
                } catch (error) {
                    logout();
                    console.log(error);
                }
            }
        };
        initAuth();
    }, [logout]);

    const value: AuthContextType = useMemo(() => ({
        user: user as User,
        isAuthenticated,
        login,
        logout,
    }), [user, isAuthenticated, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};