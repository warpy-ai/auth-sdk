import * as React from "react";
import { type ReactNode } from "react";
import type { Session } from "../core";
export interface AuthContextValue {
    session: Session | null;
    loading: boolean;
    signIn: (email: string, captchaToken?: string) => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}
export interface AuthProviderProps {
    children: ReactNode;
    secret: string;
    onSignIn?: (session: Session) => void;
    onSignOut?: () => void;
}
export declare function AuthProvider({ children, secret, onSignIn, onSignOut, }: AuthProviderProps): React.JSX.Element;
export declare function useAuth(): AuthContextValue;
