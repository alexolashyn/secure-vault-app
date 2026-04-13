import type {BaseResponse} from "./base-response.ts";

export interface RegisterData {
    email: string;
    password: string;
    publicKey: string;
    encryptedPrivateKey: string;
    kdfSalt: string;
    iv: string;
}

export type LoginData = Pick<RegisterData, 'email' | 'password'>

export interface AuthDetails {
    accessToken?: string;
    user?: {
        id: string;
        email: string;
    };
}

export type AuthResponse = BaseResponse<AuthDetails>


export interface User {
    id: string;

    email: string;

    publicKey: string;

    encryptedPrivateKey: string;

    kdfSalt: string;

    iv: string;
}

export type UserResponse = BaseResponse<User>;

