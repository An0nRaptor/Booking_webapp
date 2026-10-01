import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { Search, Menu, CircleUserRound, LogOut, CalendarDays, Building2, User } from "lucide-react";
import { useAuth } from "../auth.jsx";

export function Logo() {
    return (
        <Link to="/" className="flex items-center gap-2 text-brand-500" aria-label="TravelNest home">
            <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
                <rect width="32" height="32" rx="8" fill="currentColor" />
                <path d="M16 7 6.5 15.2a1 1 0 0 0 1.3 1.5L9 15.7V24a1 1 0 0 0 1 1h4.5v-5.5h3V25H22a1 1 0 0 0 1-1v-8.3l1.2 1a1 1 0 0 0 1.3-1.5Z" fill="#fff" />
            </svg>
            <span className="hidden text-xl font-extrabold tracking-tight sm:inline">travelnest</span>
        </Link>
    );
}

function SearchBar() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const [q, setQ] = useState(params.get("q") || "");
    const [guests, setGuests] = useState(params.get("guests") || "");

    useEffect(() => {
        setQ(params.get("q") || "");
        setGuests(params.get("guests") || "");
    }, [params]);

    const submit = e => {
        e.preventDefault();
        const next = new URLSearchParams();
        if (q.trim()) next.set("q", q.trim());
        if (Number(guests) > 0) next.set("guests", guests);
        navigate(`/?${next}`);
    };

    return (
        <form onSubmit={submit} role="search" className="flex w-full max-w-md items-center rounded-full border border-slate-300 bg-white py-1.5 pl-5 pr-1.5 shadow-sm transition hover:shadow-md">
            <label className="min-w-0 flex-1">
                <span className="sr-only">Where</span>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Where to?" className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-500" />
            </label>
            <span className="mx-3 h-6 w-px bg-slate-200" />
            <label className="w-20">
                <span className="sr-only">Guests</span>
                <input type="number" min="1" value={guests} onChange={e => setGuests(e.target.value)} placeholder="Guests" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500" />
            </label>
            <button type="submit" className="ml-2 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600" aria-label="Search">
                <Search className="h-4 w-4" strokeWidth={2.5} />
            </button>
        </form>
    );
}

function UserMenu() {
    const { user, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!open) return;
        const close = e => !ref.current?.contains(e.target) && setOpen(false);
        const esc = e => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", close);
        document.addEventListener("keydown", esc);
        return () => {
            document.removeEventListener("mousedown", close);
            document.removeEventListener("keydown", esc);
        };
    }, [open]);

    const item = "flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-slate-50";

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-2 rounded-full border border-slate-300 py-1.5 pl-3 pr-1.5 transition hover:shadow-md"
                aria-haspopup="menu"
                aria-expanded={open}
            >
                <Menu className="h-4 w-4" />
                {user ? (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-white">
                        {user.name.charAt(0).toUpperCase()}
                    </span>
                ) : (
                    <CircleUserRound className="h-8 w-8 text-slate-500" strokeWidth={1.5} />
                )}
            </button>
            {open && (
                <div role="menu" className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl" onClick={() => setOpen(false)}>
                    {user ? (
                        <>
                            <p className="px-4 pb-2 pt-1 text-xs text-slate-500">Signed in as <span className="font-semibold text-slate-700">{user.name}</span></p>
                            <Link role="menuitem" to="/account/bookings" className={item}><CalendarDays className="h-4 w-4" /> My bookings</Link>
                            <Link role="menuitem" to="/account/places" className={item}><Building2 className="h-4 w-4" /> My places</Link>
                            <Link role="menuitem" to="/account" className={item}><User className="h-4 w-4" /> Profile</Link>
                            <div className="my-2 border-t border-slate-100" />
                            <button role="menuitem" className={`${item} w-full text-left`} onClick={() => { logout(); navigate("/"); }}>
                                <LogOut className="h-4 w-4" /> Log out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link role="menuitem" to="/login" className={`${item} font-semibold`}>Log in</Link>
                            <Link role="menuitem" to="/register" className={item}>Sign up</Link>
                            <div className="my-2 border-t border-slate-100" />
                            <Link role="menuitem" to="/account/places/new" className={item}>Host your place</Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Header() {
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="page flex h-20 items-center justify-between gap-4">
                <Logo />
                <div className="hidden flex-1 justify-center md:flex">
                    <SearchBar />
                </div>
                <div className="flex items-center gap-2">
                    <NavLink to="/account/places/new" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-slate-100 lg:block">
                        Host your place
                    </NavLink>
                    <UserMenu />
                </div>
            </div>
            <div className="page pb-3 md:hidden">
                <SearchBar />
            </div>
        </header>
    );
}
