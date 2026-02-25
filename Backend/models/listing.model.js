import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        maxLength: [100, "Title must not exceed 100 characters"],
        trim: true,
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true,
        maxLength: [2000, "Description must not exceed 2000 characters"],
    },
    image: {
        type: String,
        default: "https://unsplash.com/photos/a-boat-travels-on-a-canal-in-front-of-buildings-t8OzFHgBjYk",
        set: (v) => v === "" ? "https://unsplash.com/photos/a-boat-travels-on-a-canal-in-front-of-buildings-t8OzFHgBjYk" : v,
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price cannot be negative"],
        max: [1000000, "Price cannot exceed 1,000,000"],
    },
    location: {
        type: String,
        required: [true, "Location is required"],
        trim: true,
        maxLength: [100, "Location must not exceed 100 characters"],
    },
    country: {
        type: String,
        required: [true, "Country is required"],
        trim: true,
        maxLength: [60, "Country must not exceed 60 characters"],
    },

}, { timestamps: true })

const Listing = mongoose.model("Listing", listingSchema);
export default Listing;