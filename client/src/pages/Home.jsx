import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SearchX, Home as HomeIcon } from "lucide-react";
import { api } from "../api.js";
import PlaceCard from "../components/PlaceCard.jsx";
import { EmptyState, ErrorBox } from "../components/ui.jsx";

function CardSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="aspect-[4/3.6] rounded-2xl bg-slate-200" />
            <div className="mt-3 h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-100" />
        </div>
    );
}

export default function Home() {
    const [params] = useSearchParams();
    const [places, setPlaces] = useState(null);
    const [error, setError] = useState("");
    const q = params.get("q") || "";
    const guests = params.get("guests") || "";
    const filtered = Boolean(q || guests);

    useEffect(() => {
        setPlaces(null);
        setError("");
        api(`/places?${params}`).then(setPlaces).catch(err => {
            setError(err.message);
            setPlaces([]);
        });
    }, [params]);

    return (
        <div className="page py-8">
            {filtered ? (
                <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
                    <h1 className="text-2xl">
                        {places ? `${places.length} stay${places.length === 1 ? "" : "s"}` : "Searching"}
                        {q && <> matching “{q}”</>}
                        {guests && <> for {guests}+ guests</>}
                    </h1>
                    <Link to="/" className="text-sm font-semibold underline">Clear search</Link>
                </div>
            ) : (
                <section className="relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 via-brand-600 to-rose-800 px-6 py-12 text-white sm:px-12 sm:py-16">
                    <div aria-hidden="true" className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div aria-hidden="true" className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />
                    <div className="relative max-w-xl">
                        <p className="text-sm font-semibold uppercase tracking-widest text-white/80">Stays across India</p>
                        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-white sm:text-5xl">Find a place that feels like home.</h1>
                        <p className="mt-4 text-lg text-white/85">Browse hand-picked homes, check availability and book in a few clicks. Or list your own place and start hosting.</p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a href="#stays" className="btn bg-white text-brand-600 hover:bg-brand-50">Explore stays</a>
                            <Link to="/account/places/new" className="btn border border-white/50 text-white hover:bg-white/10">Become a host</Link>
                        </div>
                    </div>
                </section>
            )}

            <ErrorBox className="mb-6">{error}</ErrorBox>

            <section id="stays" className="scroll-mt-28">
                {!filtered && places?.length > 0 && <h2 className="mb-6 text-2xl">Latest stays</h2>}
                {places === null ? (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}
                    </div>
                ) : places.length === 0 && !error ? (
                    filtered ? (
                        <EmptyState icon={SearchX} title="No stays match your search" action={<Link to="/" className="btn-secondary">See all stays</Link>}>
                            Try a different place name or fewer guests.
                        </EmptyState>
                    ) : (
                        <EmptyState icon={HomeIcon} title="No stays listed yet" action={<Link to="/account/places/new" className="btn-primary">List your place</Link>}>
                            Be the first to host on TravelNest.
                        </EmptyState>
                    )
                ) : (
                    <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {places.map(p => <PlaceCard key={p._id} place={p} />)}
                    </div>
                )}
            </section>
        </div>
    );
}
