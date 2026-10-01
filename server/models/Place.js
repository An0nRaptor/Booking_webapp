import mongoose from "mongoose";

export const PERKS = ["wifi", "parking", "tv", "pets", "kitchen", "pool", "ac", "workspace"];

const placeSchema = new mongoose.Schema(
    {
        owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        title: { type: String, required: true, trim: true },
        address: { type: String, required: true, trim: true },
        photos: [String],
        description: String,
        perks: [{ type: String, enum: PERKS }],
        extraInfo: String,
        checkIn: { type: Number, min: 0, max: 23, default: 14 },
        checkOut: { type: Number, min: 0, max: 23, default: 11 },
        maxGuests: { type: Number, min: 1, default: 2 },
        price: { type: Number, min: 1, required: true }
    },
    { timestamps: true }
);

export default mongoose.models.Place || mongoose.model("Place", placeSchema);
