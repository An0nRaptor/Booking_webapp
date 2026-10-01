import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { CalendarDays, Building2, User, LogOut } from "lucide-react";
import { useAuth } from "../auth.jsx";

const TABS = [
    { to: "/account", label: "Profile", icon: User, end: true },
    { to: "/account/bookings", label: "My bookings", icon: CalendarDays },
    { to: "/account/places", label: "My places", icon: Building2 }
];

export function AccountLayout() {
    return (
        <div className="page py-8">
            <nav className="mb-8 flex gap-2 overflow-x-auto pb-1" aria-label="Account">
                {TABS.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex flex-none items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                isActive ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`
                        }
                    >
                        <Icon className="h-4 w-4" /> {label}
                    </NavLink>
                ))}
            </nav>
            <Outlet />
        </div>
    );
}

export function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    return (
        <div className="card mx-auto max-w-md p-8 text-center">
            <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 text-3xl font-semibold text-white">
                {user.name.charAt(0).toUpperCase()}
            </span>
            <h1 className="mt-4 text-2xl">{user.name}</h1>
            <p className="text-slate-500">{user.email}</p>
            <button onClick={() => { logout(); navigate("/"); }} className="btn-secondary mt-8">
                <LogOut className="h-4 w-4" /> Log out
            </button>
        </div>
    );
}
