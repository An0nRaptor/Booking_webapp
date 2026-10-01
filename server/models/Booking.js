import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        place: { type: mongoose.Schema.Types.ObjectId, ref: "Place", required: true },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        numberOfGuests: { type: Number, required: true, min: 1 },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        // Always computed on the server from the place's nightly price.
        price: { type: Number, required: true }
    },
    { timestamps: true }
);

bookingSchema.index({ place: 1, checkIn: 1, checkOut: 1 });

export default mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
