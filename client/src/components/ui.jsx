import { Navigate, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../auth.jsx";

export function Spinner({ className = "h-5 w-5" }) {
    return <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />;
}

export function PageLoader() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center text-slate-400" role="status">
            <Spinner className="h-7 w-7" />
            <span className="sr-only">Loading…</span>
        </div>
    );
}

export function ErrorBox({ children, className = "" }) {
    if (!children) return null;
    return (
        <p role="alert" className={`flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ${className}`}>
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" />
            <span>{children}</span>
        </p>
    );
}

export function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 px-6 py-14 text-center">
            {Icon && (
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <h3 className="text-lg">{title}</h3>
            {children && <p className="mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

// Sends logged-out visitors to /login and brings them back afterwards.
export function RequireAuth({ children }) {
    const { user, ready } = useAuth();
    const location = useLocation();
    if (!ready) return <PageLoader />;
    if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
    return children;
}

export function PlacePhoto({ src, alt, className = "" }) {
    if (!src) {
        return (
            <div className={`flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400 ${className}`}>
                No photo yet
            </div>
        );
    }
    return <img src={src} alt={alt} loading="lazy" className={`object-cover ${className}`} />;
}
