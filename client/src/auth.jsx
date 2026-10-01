import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [ready, setReady] = useState(false);

    // Restore the session from a saved token.
    useEffect(() => {
        if (!tokenStore.get()) {
            setReady(true);
            return;
        }
        api("/profile")
            .then(data => setUser(data.user))
            .catch(() => tokenStore.set(null))
            .finally(() => setReady(true));
    }, []);

    const finish = useCallback(data => {
        tokenStore.set(data.token);
        setUser(data.user);
        return data.user;
    }, []);

    const value = useMemo(
        () => ({
            user,
            ready,
            login: (email, password) => api("/login", { method: "POST", body: { email, password } }).then(finish),
            register: (name, email, password) =>
                api("/register", { method: "POST", body: { name, email, password } }).then(finish),
            logout: () => {
                tokenStore.set(null);
                setUser(null);
            }
        }),
        [user, ready, finish]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
