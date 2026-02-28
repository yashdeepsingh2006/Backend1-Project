import mongoose from "mongoose";
import Listing from "../models/listing.model.js";
import { data } from "./data.js";

const MONGO_URL = "mongodb://127.0.0.1:27017/Hostly";

const initDB = async () => {
    await Listing.deleteMany({}); //deleting sample data if it exists
    await Listing.insertMany(data);
    console.log("Data was Inserted successfully");
}

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URL);
        await initDB(); //calling the initDB after the successfull connection with Database;
        console.log("DB is connected");
    } catch (err) {
        console.log("Error occured", err);
        process.exit(1);
    }
}

connectDB();