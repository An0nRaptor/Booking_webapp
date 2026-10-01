import { Wifi, Car, Tv, PawPrint, CookingPot, Waves, Snowflake, Laptop } from "lucide-react";

export const PERKS = [
    { id: "wifi", label: "Wi-Fi", icon: Wifi },
    { id: "parking", label: "Free parking", icon: Car },
    { id: "tv", label: "TV", icon: Tv },
    { id: "pets", label: "Pets allowed", icon: PawPrint },
    { id: "kitchen", label: "Kitchen", icon: CookingPot },
    { id: "pool", label: "Pool", icon: Waves },
    { id: "ac", label: "Air conditioning", icon: Snowflake },
    { id: "workspace", label: "Workspace", icon: Laptop }
];

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const money = n => inr.format(n || 0);

export const formatDate = (d, opts) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", ...opts });

export const hour = h => {
    const n = Number(h) || 0;
    const suffix = n >= 12 ? "PM" : "AM";
    return `${n % 12 || 12}:00 ${suffix}`;
};

// Date input values (YYYY-MM-DD) → whole nights between them.
export function nightsBetween(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 0;
    const ms = new Date(checkOut) - new Date(checkIn);
    return ms > 0 ? Math.round(ms / 86400000) : 0;
}

export const todayISO = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

export const addDaysISO = (iso, n) => {
    const d = new Date(iso);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
};

// Shrink photos in the browser before upload: keeps each request well
// under the serverless body limit and makes pages load faster.
export async function compressImage(file, maxSide = 1600, quality = 0.82) {
    if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
    try {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(bitmap.width * scale);
        canvas.height = Math.round(bitmap.height * scale);
        canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", quality));
        if (!blob || blob.size >= file.size) return file;
        return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
    } catch {
        return file;
    }
}
