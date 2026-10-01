import { useRef, useState } from "react";
import { ImagePlus, Link2, Star, Trash2 } from "lucide-react";
import { api } from "../api.js";
import { compressImage } from "../lib.js";
import { ErrorBox, Spinner } from "./ui.jsx";

// The first photo is the cover shown on cards.
export default function PhotosUploader({ photos, onChange }) {
    const [link, setLink] = useState("");
    const [busy, setBusy] = useState(0);
    const [error, setError] = useState("");
    const fileInput = useRef(null);

    const addByLink = async () => {
        if (!link.trim()) return;
        setError("");
        setBusy(b => b + 1);
        try {
            const url = await api("/upload-by-link", { method: "POST", body: { link: link.trim() } });
            onChange(prev => [...prev, url]);
            setLink("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(b => b - 1);
        }
    };

    const addFiles = async files => {
        setError("");
        // One request per photo keeps each under the upload size limit.
        await Promise.all(
            Array.from(files).map(async file => {
                setBusy(b => b + 1);
                try {
                    const form = new FormData();
                    form.append("photos", await compressImage(file));
                    const urls = await api("/upload", { method: "POST", form });
                    onChange(prev => [...prev, ...urls]);
                } catch (err) {
                    setError(`${file.name}: ${err.message}`);
                } finally {
                    setBusy(b => b - 1);
                }
            })
        );
        if (fileInput.current) fileInput.current.value = "";
    };

    const remove = url => onChange(prev => prev.filter(p => p !== url));
    const makeCover = url => onChange(prev => [url, ...prev.filter(p => p !== url)]);

    return (
        <div>
            <div className="flex gap-2">
                <input className="input" value={link} onChange={e => setLink(e.target.value)} placeholder="Paste an image link (https://…)" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addByLink())} />
                <button type="button" onClick={addByLink} className="btn-secondary flex-none" disabled={!link.trim()}>
                    <Link2 className="h-4 w-4" /> Add
                </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((url, i) => (
                    <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                        <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                        {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold shadow">Cover</span>}
                        <div className="absolute bottom-2 right-2 flex gap-1.5">
                            {i > 0 && (
                                <button type="button" onClick={() => makeCover(url)} className="rounded-full bg-white/90 p-1.5 shadow hover:bg-white" title="Make cover photo" aria-label="Make cover photo">
                                    <Star className="h-4 w-4" />
                                </button>
                            )}
                            <button type="button" onClick={() => remove(url)} className="rounded-full bg-white/90 p-1.5 text-red-600 shadow hover:bg-white" title="Remove photo" aria-label="Remove photo">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {Array.from({ length: busy }, (_, i) => (
                    <div key={`busy${i}`} className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                        <Spinner />
                    </div>
                ))}
                <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 text-sm font-medium text-slate-600 transition hover:border-slate-500 hover:bg-slate-50">
                    <input ref={fileInput} type="file" accept="image/*" multiple className="sr-only" onChange={e => e.target.files?.length && addFiles(e.target.files)} />
                    <ImagePlus className="h-6 w-6" />
                    Upload photos
                </label>
            </div>
            <ErrorBox className="mt-3">{error}</ErrorBox>
        </div>
    );
}
