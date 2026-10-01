import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus, Building2, Pencil, Trash2, ExternalLink } from "lucide-react";
import { api } from "../api.js";
import { PERKS, hour, money } from "../lib.js";
import PhotosUploader from "../components/PhotosUploader.jsx";
import { EmptyState, ErrorBox, PageLoader, PlacePhoto, Spinner } from "../components/ui.jsx";

export function MyPlaces() {
    const [places, setPlaces] = useState(null);
    const [error, setError] = useState("");
    const [confirmId, setConfirmId] = useState(null);

    useEffect(() => {
        api("/user-places").then(setPlaces).catch(err => setError(err.message));
    }, []);

    const remove = async id => {
        setError("");
        try {
            await api(`/places/${id}`, { method: "DELETE" });
            setPlaces(list => list.filter(p => p._id !== id));
        } catch (err) {
            setError(err.message);
        }
        setConfirmId(null);
    };

    if (!places && !error) return <PageLoader />;

    return (
        <div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-2xl">Your listings</h1>
                <Link to="/account/places/new" className="btn-primary"><Plus className="h-4 w-4" /> Add a new place</Link>
            </div>
            <ErrorBox className="mb-4">{error}</ErrorBox>
            {places?.length === 0 ? (
                <EmptyState icon={Building2} title="You haven’t listed a place yet" action={<Link to="/account/places/new" className="btn-primary">List your place</Link>}>
                    Add photos, perks and a nightly price, and guests can book it right away.
                </EmptyState>
            ) : (
                <div className="space-y-4">
                    {places?.map(p => (
                        <div key={p._id} className="card flex flex-col gap-4 overflow-hidden sm:flex-row">
                            <PlacePhoto src={p.photos[0]} alt={p.title} className="aspect-[4/3] w-full flex-none sm:w-56" />
                            <div className="flex min-w-0 flex-1 flex-col p-4 sm:pl-0">
                                <h2 className="truncate text-lg">{p.title}</h2>
                                <p className="truncate text-sm text-slate-500">{p.address}</p>
                                <p className="mt-2 line-clamp-2 text-sm text-slate-600">{p.description}</p>
                                <p className="mt-auto pt-3 text-sm"><span className="font-semibold">{money(p.price)}</span> night · up to {p.maxGuests} guests · {p.photos.length} photos</p>
                            </div>
                            <div className="flex items-center gap-2 border-t border-slate-100 p-4 sm:flex-col sm:justify-center sm:border-l sm:border-t-0">
                                {confirmId === p._id ? (
                                    <>
                                        <button onClick={() => remove(p._id)} className="btn bg-red-600 px-4 py-2 text-white hover:bg-red-700">Delete</button>
                                        <button onClick={() => setConfirmId(null)} className="btn-ghost">Cancel</button>
                                    </>
                                ) : (
                                    <>
                                        <Link to={`/place/${p._id}`} className="btn-ghost" title="View listing"><ExternalLink className="h-4 w-4" /> View</Link>
                                        <Link to={`/account/places/${p._id}`} className="btn-ghost" title="Edit"><Pencil className="h-4 w-4" /> Edit</Link>
                                        <button onClick={() => setConfirmId(p._id)} className="btn-ghost text-red-600 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /> Delete</button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const EMPTY = {
    title: "",
    address: "",
    photos: [],
    description: "",
    perks: [],
    extraInfo: "",
    checkIn: 14,
    checkOut: 11,
    maxGuests: 2,
    price: ""
};

function Section({ title, hint, children }) {
    return (
        <section className="border-b border-slate-200 py-7 last:border-0">
            <h2 className="text-lg">{title}</h2>
            {hint && <p className="hint">{hint}</p>}
            <div className={hint ? "" : "mt-3"}>{children}</div>
        </section>
    );
}

export function PlaceForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(id ? null : EMPTY);
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        api(`/places/${id}`)
            .then(p => setForm({ ...EMPTY, ...p }))
            .catch(err => setError(err.message));
    }, [id]);

    if (!form) return error ? <ErrorBox>{error}</ErrorBox> : <PageLoader />;

    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    const setPhotos = updater => setForm(f => ({ ...f, photos: typeof updater === "function" ? updater(f.photos) : updater }));
    const togglePerk = perk => setForm(f => ({ ...f, perks: f.perks.includes(perk) ? f.perks.filter(p => p !== perk) : [...f.perks, perk] }));

    const submit = async e => {
        e.preventDefault();
        setError("");
        setSaving(true);
        try {
            const saved = await api(id ? `/places/${id}` : "/places", { method: id ? "PUT" : "POST", body: form });
            navigate(`/place/${saved._id}`);
        } catch (err) {
            setError(err.message);
            setSaving(false);
        }
    };

    const hours = Array.from({ length: 24 }, (_, h) => h);

    return (
        <form onSubmit={submit} className="mx-auto max-w-3xl">
            <h1 className="text-2xl sm:text-3xl">{id ? "Edit your listing" : "List your place"}</h1>

            <Section title="Title" hint="Short and catchy, like in an advert.">
                <input className="input" required value={form.title} onChange={set("title")} placeholder="e.g. Sunny loft with a view of the hills" maxLength={90} />
            </Section>
            <Section title="Address" hint="City and area are enough for guests to find it on a map.">
                <input className="input" required value={form.address} onChange={set("address")} placeholder="e.g. Koregaon Park, Pune" />
            </Section>
            <Section title="Photos" hint="Add a few bright photos. The first one is the cover.">
                <PhotosUploader photos={form.photos} onChange={setPhotos} />
            </Section>
            <Section title="Description" hint="What makes your place special?">
                <textarea className="input min-h-[140px]" value={form.description} onChange={set("description")} />
            </Section>
            <Section title="Perks" hint="Select everything your place offers.">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {PERKS.map(({ id: perk, label, icon: Icon }) => {
                        const on = form.perks.includes(perk);
                        return (
                            <label key={perk} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 text-sm font-medium transition ${on ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}>
                                <input type="checkbox" checked={on} onChange={() => togglePerk(perk)} className="sr-only" />
                                <Icon className="h-5 w-5" strokeWidth={1.75} /> {label}
                            </label>
                        );
                    })}
                </div>
            </Section>
            <Section title="House rules" hint="Anything guests should know.">
                <textarea className="input min-h-[100px]" value={form.extraInfo} onChange={set("extraInfo")} placeholder="e.g. No parties. Quiet hours after 10 PM." />
            </Section>
            <Section title="Times, guests & price">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <label>
                        <span className="label">Check-in</span>
                        <select className="input" value={form.checkIn} onChange={set("checkIn")}>{hours.map(h => <option key={h} value={h}>{hour(h)}</option>)}</select>
                    </label>
                    <label>
                        <span className="label">Checkout</span>
                        <select className="input" value={form.checkOut} onChange={set("checkOut")}>{hours.map(h => <option key={h} value={h}>{hour(h)}</option>)}</select>
                    </label>
                    <label>
                        <span className="label">Max guests</span>
                        <input className="input" type="number" min="1" max="30" required value={form.maxGuests} onChange={set("maxGuests")} />
                    </label>
                    <label>
                        <span className="label">Price / night (₹)</span>
                        <input className="input" type="number" min="1" required value={form.price} onChange={set("price")} />
                    </label>
                </div>
            </Section>

            <ErrorBox className="mb-4">{error}</ErrorBox>
            <div className="sticky bottom-0 -mx-4 flex justify-end gap-3 border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary min-w-[140px]">
                    {saving ? <Spinner /> : id ? "Save changes" : "Publish listing"}
                </button>
            </div>
        </form>
    );
}
