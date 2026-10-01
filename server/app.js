import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { connectDB, photoBucket } from "./db.js";
import User from "./models/User.js";
import Place, { PERKS } from "./models/Place.js";
import Booking from "./models/Booking.js";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const DAY = 24 * 60 * 60 * 1000;

const app = express();
app.disable("x-powered-by");

// On Netlify the function sees /.netlify/functions/api/...; locally it's /api/...
app.use((req, _res, next) => {
    req.url = req.url.replace(/^\/\.netlify\/functions\/api/, "/api");
    next();
});
app.use(express.json({ limit: "1mb" }));

// Every route needs the database; connect lazily and reuse.
app.use(async (_req, _res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
// Express 4 doesn't forward async errors on its own.
const route = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const signToken = user =>
    jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: "7d" });

function requireAuth(req, _res, next) {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return next(new HttpError(401, "Please log in first."));
    try {
        req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
        next();
    } catch {
        next(new HttpError(401, "Your session has expired. Please log in again."));
    }
}

const isId = id => mongoose.isValidObjectId(id);
const escapeRegex = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---------- Auth ----------

app.post("/api/register", route(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !email || !password) throw new HttpError(400, "Name, email and password are required.");
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new HttpError(400, "Please enter a valid email address.");
    if (password.length < 6) throw new HttpError(400, "Password must be at least 6 characters.");
    if (await User.exists({ email })) throw new HttpError(409, "An account with this email already exists.");

    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ token: signToken(user), user: user.toPublic() });
}));

app.post("/api/login", route(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email });
    // Same message for both cases, so the form can't be used to probe emails.
    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new HttpError(401, "Incorrect email or password.");
    }
    res.json({ token: signToken(user), user: user.toPublic() });
}));

app.get("/api/profile", requireAuth, route(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "Account not found.");
    res.json({ user: user.toPublic() });
}));

// ---------- Photos (stored in MongoDB GridFS so they survive redeploys) ----------

function savePhoto(buffer, contentType, filename) {
    return new Promise((resolve, reject) => {
        const stream = photoBucket().openUploadStream(filename || "photo", {
            metadata: { contentType }
        });
        stream.on("error", reject);
        stream.on("finish", () => resolve(`/api/photos/${stream.id}`));
        stream.end(buffer);
    });
}

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PHOTO_BYTES, files: 10 },
    fileFilter: (_req, file, cb) =>
        cb(file.mimetype.startsWith("image/") ? null : new HttpError(400, "Only image files are allowed."), true)
});

app.post("/api/upload", requireAuth, upload.array("photos", 10), route(async (req, res) => {
    if (!req.files?.length) throw new HttpError(400, "No photos received.");
    const urls = await Promise.all(
        req.files.map(f => savePhoto(f.buffer, f.mimetype, f.originalname))
    );
    res.status(201).json(urls);
}));

app.post("/api/upload-by-link", requireAuth, route(async (req, res) => {
    let url;
    try {
        url = new URL(String(req.body.link || ""));
    } catch {
        throw new HttpError(400, "That doesn't look like a valid link.");
    }
    if (!["http:", "https:"].includes(url.protocol)) throw new HttpError(400, "Only http(s) links are supported.");

    const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(8000) }).catch(() => null);
    const type = response?.headers.get("content-type") || "";
    if (!response?.ok || !type.startsWith("image/")) throw new HttpError(400, "Couldn't download an image from that link.");
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_PHOTO_BYTES) throw new HttpError(413, "That image is larger than 5 MB.");

    res.status(201).json(await savePhoto(buffer, type, url.pathname.split("/").pop()));
}));

app.get("/api/photos/:id", route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Photo not found.");
    const id = new mongoose.Types.ObjectId(req.params.id);
    const [file] = await photoBucket().find({ _id: id }).toArray();
    if (!file) throw new HttpError(404, "Photo not found.");

    const chunks = [];
    for await (const chunk of photoBucket().openDownloadStream(id)) chunks.push(chunk);
    res.set({
        "Content-Type": file.metadata?.contentType || "image/jpeg",
        // Photo ids never change content, so browsers/CDN can cache forever.
        "Cache-Control": "public, max-age=31536000, immutable"
    });
    res.send(Buffer.concat(chunks));
}));

// ---------- Places ----------

function placeFields(body) {
    const toHour = v => Math.min(23, Math.max(0, parseInt(v, 10) || 0));
    const fields = {
        title: String(body.title || "").trim(),
        address: String(body.address || "").trim(),
        photos: Array.isArray(body.photos) ? body.photos.filter(p => typeof p === "string").slice(0, 30) : [],
        description: String(body.description || ""),
        perks: Array.isArray(body.perks) ? body.perks.filter(p => PERKS.includes(p)) : [],
        extraInfo: String(body.extraInfo || ""),
        checkIn: toHour(body.checkIn ?? 14),
        checkOut: toHour(body.checkOut ?? 11),
        maxGuests: Math.max(1, parseInt(body.maxGuests, 10) || 1),
        price: Math.max(1, Number(body.price) || 0)
    };
    if (!fields.title || !fields.address) throw new HttpError(400, "Title and address are required.");
    if (!body.price || Number(body.price) < 1) throw new HttpError(400, "Please set a nightly price.");
    return fields;
}

app.get("/api/places", route(async (req, res) => {
    const filter = {};
    const q = String(req.query.q || "").trim();
    if (q) {
        const re = new RegExp(escapeRegex(q), "i");
        filter.$or = [{ title: re }, { address: re }];
    }
    const guests = parseInt(req.query.guests, 10);
    if (guests > 0) filter.maxGuests = { $gte: guests };
    res.json(await Place.find(filter).sort({ createdAt: -1 }).limit(60));
}));

app.get("/api/places/:id", route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Place not found.");
    const place = await Place.findById(req.params.id).populate("owner", "name");
    if (!place) throw new HttpError(404, "Place not found.");
    res.json(place);
}));

// Booked date ranges, so the booking form can warn before submitting.
app.get("/api/places/:id/booked", route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Place not found.");
    const bookings = await Booking.find(
        { place: req.params.id, checkOut: { $gte: new Date() } },
        { checkIn: 1, checkOut: 1, _id: 0 }
    ).sort({ checkIn: 1 });
    res.json(bookings);
}));

app.get("/api/user-places", requireAuth, route(async (req, res) => {
    res.json(await Place.find({ owner: req.userId }).sort({ createdAt: -1 }));
}));

app.post("/api/places", requireAuth, route(async (req, res) => {
    const place = await Place.create({ ...placeFields(req.body), owner: req.userId });
    res.status(201).json(place);
}));

async function ownedPlace(req) {
    if (!isId(req.params.id)) throw new HttpError(404, "Place not found.");
    const place = await Place.findById(req.params.id);
    if (!place) throw new HttpError(404, "Place not found.");
    if (String(place.owner) !== req.userId) throw new HttpError(403, "You can only change your own places.");
    return place;
}

app.put("/api/places/:id", requireAuth, route(async (req, res) => {
    const place = await ownedPlace(req);
    place.set(placeFields(req.body));
    await place.save();
    res.json(place);
}));

app.delete("/api/places/:id", requireAuth, route(async (req, res) => {
    const place = await ownedPlace(req);
    if (await Booking.exists({ place: place._id, checkOut: { $gte: new Date() } })) {
        throw new HttpError(409, "This place has upcoming bookings and can't be deleted.");
    }
    await place.deleteOne();
    res.status(204).end();
}));

// ---------- Bookings ----------

app.post("/api/bookings", requireAuth, route(async (req, res) => {
    const { place: placeId, name, phone } = req.body;
    const guests = parseInt(req.body.numberOfGuests, 10);
    const checkIn = new Date(req.body.checkIn);
    const checkOut = new Date(req.body.checkOut);

    if (!isId(placeId)) throw new HttpError(400, "Unknown place.");
    const place = await Place.findById(placeId);
    if (!place) throw new HttpError(404, "Place not found.");
    if (String(place.owner) === req.userId) throw new HttpError(400, "You can't book your own place.");
    if (isNaN(checkIn) || isNaN(checkOut)) throw new HttpError(400, "Please choose check-in and check-out dates.");

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (checkIn < today) throw new HttpError(400, "Check-in can't be in the past.");
    const nights = Math.round((checkOut - checkIn) / DAY);
    if (nights < 1) throw new HttpError(400, "Check-out must be after check-in.");
    if (nights > 60) throw new HttpError(400, "Stays are limited to 60 nights.");
    if (!(guests >= 1)) throw new HttpError(400, "Please enter the number of guests.");
    if (guests > place.maxGuests) throw new HttpError(400, `This place hosts up to ${place.maxGuests} guests.`);
    if (!String(name || "").trim() || !String(phone || "").trim()) throw new HttpError(400, "Name and phone are required.");

    const clash = await Booking.exists({ place: place._id, checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn } });
    if (clash) throw new HttpError(409, "Those dates are already booked. Please pick different dates.");

    const booking = await Booking.create({
        place: place._id,
        user: req.userId,
        checkIn,
        checkOut,
        numberOfGuests: guests,
        name,
        phone,
        price: nights * place.price
    });
    res.status(201).json(booking);
}));

app.get("/api/bookings", requireAuth, route(async (req, res) => {
    res.json(await Booking.find({ user: req.userId }).sort({ checkIn: -1 }).populate("place"));
}));

app.delete("/api/bookings/:id", requireAuth, route(async (req, res) => {
    if (!isId(req.params.id)) throw new HttpError(404, "Booking not found.");
    const booking = await Booking.findOne({ _id: req.params.id, user: req.userId });
    if (!booking) throw new HttpError(404, "Booking not found.");
    if (booking.checkIn < new Date()) throw new HttpError(400, "Past or ongoing stays can't be cancelled.");
    await booking.deleteOne();
    res.status(204).end();
}));

// ---------- Fallbacks ----------

app.use("/api", (_req, _res, next) => next(new HttpError(404, "Not found.")));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === "LIMIT_FILE_SIZE" ? "Each photo must be under 5 MB." : err.message;
        return res.status(400).json({ error: message });
    }
    const status = err.status || 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: status >= 500 ? "Something went wrong on our side. Please try again." : err.message });
});

export default app;
