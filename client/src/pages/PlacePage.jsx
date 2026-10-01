import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, Users, Clock, ArrowLeft } from "lucide-react";
import { api } from "../api.js";
import { PERKS, hour } from "../lib.js";
import Gallery from "../components/Gallery.jsx";
import BookingWidget from "../components/BookingWidget.jsx";
import { EmptyState, PageLoader } from "../components/ui.jsx";

export default function PlacePage() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        setPlace(null);
        api(`/places/${id}`).then(setPlace).catch(err => setError(err.message));
    }, [id]);

    useEffect(() => {
        if (place) document.title = `${place.title} · TravelNest`;
        return () => { document.title = "TravelNest · Find your next stay"; };
    }, [place]);

    if (error) {
        return (
            <div className="page py-16">
                <EmptyState title="We couldn’t find that stay" action={<Link to="/" className="btn-secondary">Back to all stays</Link>}>{error}</EmptyState>
            </div>
        );
    }
    if (!place) return <PageLoader />;

    const perks = PERKS.filter(p => place.perks?.includes(p.id));

    return (
        <div className="page py-6 sm:py-8">
            <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" /> All stays
            </Link>
            <h1 className="text-2xl sm:text-3xl">{place.title}</h1>
            <a
                href={`https://maps.google.com/?q=${encodeURIComponent(place.address)}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold underline"
            >
                <MapPin className="h-4 w-4" /> {place.address}
            </a>

            <div className="mt-6">
                <Gallery photos={place.photos} title={place.title} />
            </div>

            <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
                        <div>
                            <h2 className="text-xl">Hosted by {place.owner?.name || "a TravelNest host"}</h2>
                            <p className="mt-1 flex items-center gap-1.5 text-slate-600"><Users className="h-4 w-4" /> Up to {place.maxGuests} guest{place.maxGuests > 1 ? "s" : ""}</p>
                        </div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-lg font-semibold text-white">
                            {(place.owner?.name || "T").charAt(0)}
                        </span>
                    </div>

                    {place.description && (
                        <section className="border-b border-slate-200 py-8">
                            <h2 className="mb-3 text-xl">About this place</h2>
                            <p className="whitespace-pre-line leading-relaxed text-slate-700">{place.description}</p>
                        </section>
                    )}

                    {perks.length > 0 && (
                        <section className="border-b border-slate-200 py-8">
                            <h2 className="mb-5 text-xl">What this place offers</h2>
                            <ul className="grid gap-4 sm:grid-cols-2">
                                {perks.map(({ id: perkId, label, icon: Icon }) => (
                                    <li key={perkId} className="flex items-center gap-3 text-slate-700">
                                        <Icon className="h-6 w-6 text-slate-500" strokeWidth={1.5} /> {label}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <section className="py-8">
                        <h2 className="mb-5 text-xl">Things to know</h2>
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div>
                                <h3 className="mb-2 flex items-center gap-2 text-base"><Clock className="h-4 w-4" /> House times</h3>
                                <p className="text-slate-600">Check-in after {hour(place.checkIn)}</p>
                                <p className="text-slate-600">Checkout before {hour(place.checkOut)}</p>
                            </div>
                            {place.extraInfo && (
                                <div>
                                    <h3 className="mb-2 text-base">House rules</h3>
                                    <p className="whitespace-pre-line text-slate-600">{place.extraInfo}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                <aside>
                    <div className="lg:sticky lg:top-28">
                        <BookingWidget place={place} />
                    </div>
                </aside>
            </div>
        </div>
    );
}
