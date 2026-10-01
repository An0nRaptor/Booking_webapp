import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { addDaysISO, formatDate, money, nightsBetween, todayISO } from "../lib.js";
import { ErrorBox, Spinner } from "./ui.jsx";

export default function BookingWidget({ place }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [guests, setGuests] = useState(1);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [booked, setBooked] = useState([]);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) setName(n => n || user.name);
    }, [user]);

    useEffect(() => {
        api(`/places/${place._id}/booked`).then(setBooked).catch(() => {});
    }, [place._id]);

    const nights = nightsBetween(checkIn, checkOut);
    const isOwner = user && String(place.owner?._id || place.owner) === String(user.id);
    const clash =
        nights > 0 &&
        booked.some(b => new Date(b.checkIn) < new Date(checkOut) && new Date(b.checkOut) > new Date(checkIn));

    const submit = async e => {
        e.preventDefault();
        if (!user) {
            navigate("/login", { state: { from: location.pathname } });
            return;
        }
        setError("");
        setSaving(true);
        try {
            const booking = await api("/bookings", {
                method: "POST",
                body: { place: place._id, checkIn, checkOut, numberOfGuests: guests, name, phone }
            });
            navigate(`/account/bookings/${booking._id}`, { state: { justBooked: true } });
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    const field = "block px-3 py-2.5";
    const fieldLabel = "block text-[10px] font-bold uppercase tracking-wide text-slate-700";

    return (
        <div className="card p-6 shadow-xl shadow-slate-200/60">
            <p className="text-xl">
                <span className="font-semibold">{money(place.price)}</span> <span className="text-base text-slate-600">night</span>
            </p>

            {isOwner ? (
                <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                    This is your listing.{" "}
                    <Link to={`/account/places/${place._id}`} className="font-semibold text-slate-900 underline">Edit it</Link>
                </div>
            ) : (
                <form onSubmit={submit} className="mt-5">
                    <div className="overflow-hidden rounded-xl border border-slate-400">
                        <div className="grid grid-cols-2 divide-x divide-slate-400">
                            <label className={field}>
                                <span className={fieldLabel}>Check-in</span>
                                <input type="date" required min={todayISO()} value={checkIn} onChange={e => {
                                    setCheckIn(e.target.value);
                                    if (checkOut && e.target.value >= checkOut) setCheckOut("");
                                }} className="w-full bg-transparent text-sm outline-none" />
                            </label>
                            <label className={field}>
                                <span className={fieldLabel}>Check-out</span>
                                <input type="date" required min={checkIn ? addDaysISO(checkIn, 1) : todayISO()} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="w-full bg-transparent text-sm outline-none" />
                            </label>
                        </div>
                        <label className={`${field} border-t border-slate-400`}>
                            <span className={fieldLabel}>Guests</span>
                            <select value={guests} onChange={e => setGuests(Number(e.target.value))} className="w-full bg-transparent text-sm outline-none">
                                {Array.from({ length: place.maxGuests }, (_, i) => i + 1).map(n => (
                                    <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {nights > 0 && user && (
                        <div className="mt-4 space-y-3">
                            <label className="block">
                                <span className="label">Full name</span>
                                <input className="input" required value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                            </label>
                            <label className="block">
                                <span className="label">Phone number</span>
                                <input className="input" required type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" />
                            </label>
                        </div>
                    )}

                    {clash && <ErrorBox className="mt-4">Some of those nights are already booked. Try different dates.</ErrorBox>}
                    <ErrorBox className="mt-4">{error}</ErrorBox>

                    <button type="submit" disabled={saving || clash} className="btn-primary mt-4 w-full py-3.5 text-base">
                        {saving ? <Spinner /> : user ? "Reserve" : "Log in to reserve"}
                    </button>

                    {nights > 0 ? (
                        <div className="mt-5 space-y-2 text-[15px]">
                            <p className="flex justify-between text-slate-600">
                                <span className="underline">{money(place.price)} × {nights} night{nights > 1 ? "s" : ""}</span>
                                <span>{money(place.price * nights)}</span>
                            </p>
                            <p className="flex justify-between border-t border-slate-200 pt-3 font-semibold">
                                <span>Total</span>
                                <span>{money(place.price * nights)}</span>
                            </p>
                        </div>
                    ) : (
                        <p className="mt-3 text-center text-sm text-slate-500">You won’t be charged. This is a demo.</p>
                    )}
                </form>
            )}

            {booked.length > 0 && !isOwner && (
                <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">Already booked</p>
                    <ul className="mt-1 space-y-0.5">
                        {booked.slice(0, 4).map(b => (
                            <li key={b.checkIn}>{formatDate(b.checkIn, { year: undefined })} → {formatDate(b.checkOut, { year: undefined })}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
