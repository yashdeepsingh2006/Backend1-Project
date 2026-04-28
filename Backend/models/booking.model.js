import mongoose from "mongoose";

const Schema = mongoose.Schema;

const bookingSchema = new Schema(
    {
        listing: {
            type: Schema.Types.ObjectId,
            ref: "Listing",
            required: [true, "Listing is required"],
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        checkIn: {
            type: Date,
            required: [true, "Check-in date is required"],
        },
        checkOut: {
            type: Date,
            required: [true, "Check-out date is required"],
            validate: {
                validator: function (value) {
                    return this.checkIn ? value > this.checkIn : true;
                },
                message: "Check-out date must be after check-in date",
            },
        },
        guests: {
            type: Number,
            required: [true, "Number of guests is required"],
            min: [1, "At least 1 guest is required"],
            max: [20, "Guests cannot exceed 20"],
        },
        totalPrice: {
            type: Number,
            required: [true, "Total price is required"],
            min: [0, "Total price cannot be negative"],
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "completed"],
            default: "pending",
        },
        specialRequests: {
            type: String,
            trim: true,
            maxLength: [500, "Special requests must not exceed 500 characters"],
            default: "",
        },
    },
    { timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;