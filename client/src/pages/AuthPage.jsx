import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "../auth.jsx";
import { ErrorBox, Spinner } from "../components/ui.jsx";

// Public demo guest created by `npm run seed`, so visitors can try booking
// without signing up.
const DEMO = { email: "demo@travelnest.dev", password: "demo1234" };

export default function AuthPage({ mode }) {
    const isLogin = mode === "login";
    const { user, login, register } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || "/";

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    if (user) return <Navigate to={from} replace />;

    const run = async action => {
        setError("");
        setBusy(true);
        try {
            await action();
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
            setBusy(false);
        }
    };

    const submit = e => {
        e.preventDefault();
        run(() => (isLogin ? login(email, password) : register(name, email, password)));
    };

    return (
        <div className="page flex min-h-[70vh] items-center justify-center py-12">
            <div className="w-full max-w-md">
                <h1 className="text-center text-3xl">{isLogin ? "Welcome back" : "Create your account"}</h1>
                <p className="mt-2 text-center text-slate-500">
                    {isLogin ? "Log in to book stays and manage your places." : "Book stays and host your own place."}
                </p>

                <form onSubmit={submit} className="card mt-8 space-y-4 p-6 sm:p-8">
                    {!isLogin && (
                        <label className="block">
                            <span className="label">Name</span>
                            <input className="input" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                        </label>
                    )}
                    <label className="block">
                        <span className="label">Email</span>
                        <input className="input" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                    </label>
                    <label className="block">
                        <span className="label">Password</span>
                        <input className="input" type="password" required minLength={isLogin ? undefined : 6} value={password} onChange={e => setPassword(e.target.value)} autoComplete={isLogin ? "current-password" : "new-password"} />
                        {!isLogin && <span className="mt-1 block text-xs text-slate-500">At least 6 characters.</span>}
                    </label>
                    <ErrorBox>{error}</ErrorBox>
                    <button type="submit" disabled={busy} className="btn-primary w-full">
                        {busy ? <Spinner /> : isLogin ? "Log in" : "Sign up"}
                    </button>

                    {isLogin && (
                        <>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
                            </div>
                            <button type="button" disabled={busy} onClick={() => run(() => login(DEMO.email, DEMO.password))} className="btn-secondary w-full">
                                <Sparkles className="h-4 w-4 text-brand-500" /> Try the demo account
                            </button>
                        </>
                    )}
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                    {isLogin ? "New to TravelNest? " : "Already have an account? "}
                    <Link to={isLogin ? "/register" : "/login"} state={location.state} className="font-semibold text-slate-900 underline">
                        {isLogin ? "Create an account" : "Log in"}
                    </Link>
                </p>
            </div>
        </div>
    );
}
