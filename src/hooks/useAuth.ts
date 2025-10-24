// src/hooks/useAuth.ts
import { createContext, useContext, useEffect, useState } from 'react';
import { getSession, signIn, signOut } from '../core';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  useEffect(() => {
    // Fetch session on mount, auto-revalidate
    getSession().then(setSession);
  }, []);
  return <AuthContext.Provider value={{ session, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}