import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB is connected");
    } catch (err) {
        console.log("Error occured", err);
        process.exit(1);
    }
}

export default connectDB;