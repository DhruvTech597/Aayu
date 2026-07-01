import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

console.log("Connecting to", MONGO_URI);

const run = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected successfully!");

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Get user count and some users
    const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
    const users = await User.find({});
    console.log(`Total Users: ${users.length}`);
    users.forEach(u => {
      console.log(`- ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
    });

    // Get patient count and some patients
    const Patient = mongoose.model("Patient", new mongoose.Schema({}, { strict: false }));
    const patients = await Patient.find({});
    console.log(`Total Patients: ${patients.length}`);
    patients.forEach(p => {
      console.log(`- ID: ${p._id}, Name: ${p.fullName}, Phone: ${p.phone}`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
