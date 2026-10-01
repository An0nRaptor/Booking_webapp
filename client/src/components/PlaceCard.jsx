import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { money } from "../lib.js";
import { PlacePhoto } from "./ui.jsx";

export default function PlaceCard({ place }) {
    return (
        <Link to={`/place/${place._id}`} className="group block focus:outline-none">
            <div className="relative aspect-[4/3.6] overflow-hidden rounded-2xl bg-slate-100 ring-brand-500 ring-offset-2 group-focus-visible:ring-2">
                <PlacePhoto src={place.photos?.[0]} alt={place.title} className="h-full w-full transition duration-500 group-hover:scale-105" />
                {place.photos?.length > 1 && (
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white backdrop-blur">
                        1/{place.photos.length}
                    </span>
                )}
            </div>
            <div className="mt-3 flex items-start justify-between gap-3">
                <h3 className="truncate text-[15px] font-semibold">{place.address}</h3>
                <span className="flex flex-none items-center gap-1 text-sm text-slate-600">
                    <Users className="h-3.5 w-3.5" /> {place.maxGuests}
                </span>
            </div>
            <p className="truncate text-sm text-slate-500">{place.title}</p>
            <p className="mt-1 text-[15px]">
                <span className="font-semibold">{money(place.price)}</span> <span className="text-slate-600">night</span>
            </p>
        </Link>
    );
}
