import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CheckCircle2, Moon, Users, Phone, ArrowLeft } from "lucide-react";
import { api } from "../api.js";
import { formatDate, money, nightsBetween } from "../lib.js";
import { EmptyState, ErrorBox, PageLoader, PlacePhoto, Spinner } from "../components/ui.jsx";
import Gallery from "../components/Gallery.jsx";

const isUpcoming = b => new Date(b.checkIn) > new Date();

function Stay({ booking }) {
    const nights = nightsBetween(booking.checkIn, booking.checkOut);
    return (
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> {formatDate(booking.checkIn)} → {formatDate(booking.checkOut)}</span>
            <span className="flex items-center gap-1.5"><Moon className="h-4 w-4" /> {nights} night{nights > 1 ? "s" : ""}</span>
        </span>
    );
}

export function MyBookings() {
    const [bookings, setBookings] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api("/bookings").then(setBookings).catch(err => setError(err.message));
    }, []);

    if (error) return <ErrorBox>{error}</ErrorBox>;
    if (!bookings) return <PageLoader />;
    if (bookings.length === 0) {
        return (
            <EmptyState icon={CalendarDays} title="No trips booked yet" action={<Link to="/" className="btn-primary">Find a stay</Link>}>
                When you reserve a stay, it shows up here.
            </EmptyState>
        );
    }

    return (
        <div className="space-y-4">
            {bookings.map(b => (
                <Link key={b._id} to={`/account/bookings/${b._id}`} className="card flex gap-4 overflow-hidden transition hover:shadow-lg sm:gap-6">
                    <PlacePhoto src={b.place?.photos?.[0]} alt={b.place?.title || "Stay"} className="w-32 flex-none sm:w-52" />
                    <div className="min-w-0 py-4 pr-4">
                        <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${isUpcoming(b) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                            {isUpcoming(b) ? "Upcoming" : "Past"}
                        </span>
                        <h2 className="truncate text-lg">{b.place?.title || "This place was removed"}</h2>
                        <p className="mb-3 truncate text-sm text-slate-500">{b.place?.address}</p>
                        <Stay booking={b} />
                        <p className="mt-2 font-semibold">{money(b.price)} total</p>
                    </div>
                </Link>
            ))}
        </div>
    );
}

export function BookingDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");
    const [confirmCancel, setConfirmCancel] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        api("/bookings")
            .then(list => {
                const found = list.find(b => b._id === id);
                if (found) setBooking(found);
                else setError("We couldn’t find that booking.");
            })
            .catch(err => setError(err.message));
    }, [id]);

    const cancel = async () => {
        setCancelling(true);
        try {
            await api(`/bookings/${id}`, { method: "DELETE" });
            navigate("/account/bookings");
        } catch (err) {
            setError(err.message);
            setCancelling(false);
        }
    };

    if (error && !booking) return <ErrorBox>{error}</ErrorBox>;
    if (!booking) return <PageLoader />;
    const place = booking.place;

    return (
        <div>
            <Link to="/account/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> All bookings
            </Link>
            {state?.justBooked && (
                <p className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 font-medium text-emerald-800">
                    <CheckCircle2 className="h-5 w-5" /> You’re booked! Here are your trip details.
                </p>
            )}
            <h1 className="text-2xl sm:text-3xl">{place?.title || "Removed listing"}</h1>
            {place && <Link to={`/place/${place._id}`} className="mt-1 inline-block text-sm font-semibold underline">{place.address}</Link>}

            <div className="card my-6 flex flex-wrap items-center justify-between gap-6 p-6">
                <div className="space-y-2">
                    <Stay booking={booking} />
                    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {booking.numberOfGuests} guest{booking.numberOfGuests > 1 ? "s" : ""}</span>
                        <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> {booking.name} · {booking.phone}</span>
                    </p>
                </div>
                <div className="rounded-xl bg-brand-500 px-6 py-4 text-white">
                    <p className="text-sm text-white/80">Total price</p>
                    <p className="text-2xl font-bold">{money(booking.price)}</p>
                </div>
            </div>

            {place && <Gallery photos={place.photos} title={place.title} />}

            {isUpcoming(booking) && (
                <div className="mt-8 border-t border-slate-200 pt-6">
                    <ErrorBox className="mb-4">{error}</ErrorBox>
                    {confirmCancel ? (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-sm text-slate-700">Cancel this booking?</span>
                            <button onClick={cancel} disabled={cancelling} className="btn bg-red-600 text-white hover:bg-red-700">
                                {cancelling ? <Spinner /> : "Yes, cancel"}
                            </button>
                            <button onClick={() => setConfirmCancel(false)} className="btn-secondary">Keep it</button>
                        </div>
                    ) : (
                        <button onClick={() => setConfirmCancel(true)} className="btn-secondary">Cancel booking</button>
                    )}
                </div>
            )}
        </div>
    );
}
