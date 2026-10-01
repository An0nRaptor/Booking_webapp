// Seeds demo listings + a public demo guest account: `npm run seed`.
// The host account gets a random password unless SEED_HOST_PASSWORD is set,
// so nobody can sign in as the host and edit the demo listings.
// Safe to re-run: it replaces the demo host's listings each time.
// Photos are public-domain / CC0 images from Wikimedia Commons, copied into
// GridFS so the app never depends on hotlinking.
import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB, photoBucket } from "./db.js";
import User from "./models/User.js";
import Place from "./models/Place.js";
import Booking from "./models/Booking.js";

const HOST = { name: "TravelNest Stays", email: "host@travelnest.dev", password: process.env.SEED_HOST_PASSWORD || randomBytes(18).toString("base64url") };
const DEMO = { name: "Demo Guest", email: "demo@travelnest.dev", password: "demo1234" };
const UA = { "User-Agent": "TravelNestSeed/1.0 (portfolio demo; rahulyadavaudi06@gmail.com)" };

const usvi = n => `File:USVI IMG ${n}`;
const LISTINGS = [
    {
        title: "Ocean-view villa with a private pool",
        address: "Vagator, North Goa",
        price: 18500,
        maxGuests: 8,
        perks: ["wifi", "pool", "parking", "kitchen", "ac", "tv"],
        checkIn: 14,
        checkOut: 11,
        description:
            "A whitewashed villa on the cliffs above the Arabian Sea. Spend the day by the long infinity pool, cook in the bright open kitchen and watch the sunset from the stone patio.\n\nFour bedrooms, a shaded outdoor dining area and a short walk down to the beach.",
        extraInfo: "No parties or events. Pool hours 7 AM – 9 PM.",
        photos: [
            usvi("5409 - Serene tropical poolside with palm trees stone patio and a villa under a bright sky.jpg"),
            usvi("5417 - Serene coastal villa with a long pool surrounded by palm trees and overlooking the ocean under a cloudy sky.jpg"),
            usvi("5201 - Bright modern bedroom with a white vaulted ceiling a colorful zigzag rug and a four-poster bed.jpg"),
            usvi("5159 - Bright modern kitchen with white cabinets a central island and pendant lights under a vaulted ceiling.jpg"),
            usvi("5413 - Sleek white diving board extends over a tranquil pool framed by palm trees and overlooking the ocean under a soft sky.jpg")
        ]
    },
    {
        title: "Private houseboat on the backwaters",
        address: "Alleppey, Kerala",
        price: 9500,
        maxGuests: 4,
        perks: ["ac", "kitchen", "tv"],
        checkIn: 12,
        checkOut: 9,
        description:
            "Drift through palm-fringed canals on a traditional kettuvallam. Your own crew cooks fresh Kerala meals on board, and the deck is the best seat in the house for the evening light.",
        extraInfo: "The boat docks overnight from 5:30 PM, as required by local rules.",
        photos: [
            "File:A Houseboat In Kerala Backwaters.jpg",
            "File:Kerala Houseboat View.JPG",
            "File:A Houseboat in Backwaters of Kerala.jpg",
            "File:Kerala Houseboat Breakfast.JPG"
        ]
    },
    {
        title: "Stone cottage with a garden in the hills",
        address: "Coonoor, Nilgiris",
        price: 6200,
        maxGuests: 4,
        perks: ["wifi", "parking", "pets", "kitchen", "workspace"],
        checkIn: 15,
        checkOut: 11,
        description:
            "A quiet stone cottage surrounded by lawns and old trees, made for slow mornings and long walks through the tea estates. Fast Wi-Fi and a desk if you need to work.",
        extraInfo: "Pets welcome. Please keep the garden gate closed.",
        photos: [
            "File:Fox Hill Cottage 2019-04-23 (1).jpg",
            "File:Fox Hill Cottage 2019-04-23 (2).jpg",
            "File:Fox Hill Cottage 2019-04-23 (3).jpg"
        ]
    },
    {
        title: "Bright apartment close to the sea face",
        address: "Bandra West, Mumbai",
        price: 7800,
        maxGuests: 3,
        perks: ["wifi", "ac", "kitchen", "tv", "workspace"],
        checkIn: 13,
        checkOut: 11,
        description:
            "A light-filled apartment with a big living room, a fully equipped kitchen and a calm bedroom. Cafés, the promenade and the station are all within a few minutes’ walk.",
        extraInfo: "No smoking indoors. Quiet hours after 10 PM.",
        photos: [
            "File:Living room in apartment of Condomínio do Edifício Zaher, Le Blond, Rio de Janeiro, Brazil.jpg",
            usvi("5175 - White-walled bedroom with a four-poster bed colorful rug and modern furniture in bright airy setting.jpg"),
            "File:Apartment Kitchen in Washington, DC.jpg"
        ]
    },
    {
        title: "Beach hut steps from the sand",
        address: "Palolem, South Goa",
        price: 4200,
        maxGuests: 2,
        perks: ["wifi", "pets"],
        checkIn: 12,
        checkOut: 10,
        description: "Wake up to the sound of waves in a simple, breezy hut on one of Goa’s calmest beaches. Ideal for two.",
        extraInfo: "Shared bathroom block. Beach towels provided.",
        photos: [
            "File:Palolem Beach India.jpg",
            usvi("5176 - Modern white table sits under a covered patio with stone walls and arched openings overlooking a pool and palm trees.jpg")
        ]
    }
];

async function commonsUrls(titles) {
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    const params = { action: "query", format: "json", prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600", titles: titles.join("|") };
    Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
    const json = await (await fetch(u, { headers: UA })).json();
    const byTitle = {};
    for (const p of Object.values(json.query.pages)) {
        const info = p.imageinfo?.[0];
        const license = info?.extmetadata?.LicenseShortName?.value || "";
        if (!info || !/^(CC0|Public domain|PD)/i.test(license)) throw new Error(`Not usable (${license || "missing"}): ${p.title}`);
        byTitle[p.title] = info.thumburl;
    }
    // The API normalises titles; map ours via the normalized list.
    for (const n of json.query.normalized || []) byTitle[n.from] = byTitle[n.to];
    return titles.map(t => byTitle[t] || byTitle[t.replace(/_/g, " ")]);
}

async function storePhoto(url) {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    return new Promise((resolve, reject) => {
        const stream = photoBucket().openUploadStream("seed.jpg", { metadata: { contentType: res.headers.get("content-type") || "image/jpeg", seed: true } });
        stream.on("error", reject).on("finish", () => resolve(`/api/photos/${stream.id}`));
        stream.end(buffer);
    });
}

async function upsertUser({ name, email, password }) {
    const hash = await bcrypt.hash(password, 10);
    return User.findOneAndUpdate({ email }, { name, email, password: hash }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

await connectDB();
const host = await upsertUser(HOST);
await upsertUser(DEMO);

// Clear the previous demo listings (and their seed photos + bookings).
const old = await Place.find({ owner: host._id });
await Booking.deleteMany({ place: { $in: old.map(p => p._id) } });
await Place.deleteMany({ owner: host._id });
const seedFiles = await photoBucket().find({ "metadata.seed": true }).toArray();
for (const f of seedFiles) await photoBucket().delete(f._id);

// Remove throwaway accounts created by API smoke tests.
const testUsers = await User.find({ email: /@test\.dev$/ });
if (testUsers.length) {
    const ids = testUsers.map(u => u._id);
    const testPlaces = await Place.find({ owner: { $in: ids } });
    await Booking.deleteMany({ $or: [{ user: { $in: ids } }, { place: { $in: testPlaces.map(p => p._id) } }] });
    await Place.deleteMany({ owner: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
}

// Oldest first, so the newest-first home page shows the villa on top.
for (const listing of [...LISTINGS].reverse()) {
    const urls = await commonsUrls(listing.photos);
    const photos = [];
    for (const url of urls) photos.push(await storePhoto(url));
    await Place.create({ ...listing, photos, owner: host._id });
    console.log(`✓ ${listing.title} (${photos.length} photos)`);
}

console.log(`Seeded ${LISTINGS.length} listings. Removed ${testUsers.length} test users. Demo login: ${DEMO.email} / ${DEMO.password}`);
await mongoose.disconnect();
