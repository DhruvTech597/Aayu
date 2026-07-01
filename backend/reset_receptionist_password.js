import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB!");

    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const receptionist = await User.findOne({ email: "reception@test.com" });

    if (!receptionist) {
      console.log("Receptionist user not found!");
      return;
    }

    const hashedPassword = await bcrypt.hash("password123", 10);
    receptionist.password = hashedPassword;
    await receptionist.save();

    console.log("Receptionist password updated successfully to 'password123'!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
