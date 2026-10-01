import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Grid3x3, X } from "lucide-react";
import { PlacePhoto } from "./ui.jsx";

function Lightbox({ photos, start, title, onClose }) {
    const [i, setI] = useState(start);
    const go = useCallback(d => setI(n => (n + d + photos.length) % photos.length), [photos.length]);

    useEffect(() => {
        const onKey = e => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") go(1);
            if (e.key === "ArrowLeft") go(-1);
        };
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [go, onClose]);

    const nav = "absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/25";

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={`Photos of ${title}`}>
            <div className="flex items-center justify-between p-4 text-white">
                <span className="text-sm font-medium">{i + 1} / {photos.length}</span>
                <button onClick={onClose} className="rounded-full p-2 hover:bg-white/15" aria-label="Close photos">
                    <X className="h-6 w-6" />
                </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-8">
                <img src={photos[i]} alt={`${title}, photo ${i + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
                {photos.length > 1 && (
                    <>
                        <button onClick={() => go(-1)} className={`${nav} left-4`} aria-label="Previous photo"><ChevronLeft /></button>
                        <button onClick={() => go(1)} className={`${nav} right-4`} aria-label="Next photo"><ChevronRight /></button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function Gallery({ photos = [], title }) {
    const [open, setOpen] = useState(null);
    // The mosaic fits 3 (big + 2 tall) or 5 (big + 4 small) tiles evenly.
    const shown = photos.slice(0, photos.length >= 5 ? 5 : 3);
    const tile = i => (
        <button key={photos[i]} onClick={() => setOpen(i)} className="group relative h-full w-full overflow-hidden" aria-label={`Open photo ${i + 1}`}>
            <PlacePhoto src={photos[i]} alt={`${title}, photo ${i + 1}`} className="h-full w-full transition duration-300 group-hover:brightness-90" />
        </button>
    );

    if (photos.length === 0) {
        return <PlacePhoto alt={title} className="aspect-[2/1] w-full rounded-2xl" />;
    }

    return (
        <div className="relative">
            {photos.length < 3 ? (
                <div className="aspect-[2/1] overflow-hidden rounded-2xl">{tile(0)}</div>
            ) : (
                <div className="grid aspect-[2/1] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
                    <div className="col-span-4 row-span-2 sm:col-span-2">{tile(0)}</div>
                    {shown.slice(1).map((_, k) => (
                        <div key={k} className={`hidden sm:block ${shown.length === 3 ? "row-span-2 col-span-1" : ""}`}>{tile(k + 1)}</div>
                    ))}
                </div>
            )}
            <button onClick={() => setOpen(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-lg border border-slate-900 bg-white px-3 py-1.5 text-sm font-semibold shadow hover:bg-slate-50">
                <Grid3x3 className="h-4 w-4" /> Show all {photos.length} photos
            </button>
            {open !== null && <Lightbox photos={photos} start={open} title={title} onClose={() => setOpen(null)} />}
        </div>
    );
}
