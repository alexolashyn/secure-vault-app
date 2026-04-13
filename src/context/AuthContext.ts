import {createContext} from 'react';
import type {User} from '../types/auth'

export interface AuthContextType {
    user: User;
    isAuthenticated: boolean;
    login: (token: string) => void;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);