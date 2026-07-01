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

    // Use raw connection to modify database directly
    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    const receptionist = await usersCollection.findOne({ email: "reception@test.com" });
    if (!receptionist) {
      console.log("Receptionist user not found!");
      return;
    }

    const hashedPassword = await bcrypt.hash("password123", 10);
    const updateRes = await usersCollection.updateOne(
      { _id: receptionist._id },
      { $set: { password: hashedPassword } }
    );

    console.log("Update result:", updateRes);

    const updatedRep = await usersCollection.findOne({ email: "reception@test.com" });
    console.log("New password hash in DB:", updatedRep.password);

    const match = await bcrypt.compare("password123", updatedRep.password);
    console.log("Compare in script:", match);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
