import mongoose from "mongoose";
import dns from "node:dns";

// Fix for querySrv ECONNREFUSED on Windows
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected");
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

export default connectDB;