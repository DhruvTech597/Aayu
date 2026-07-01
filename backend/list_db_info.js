import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB!");

    const db = mongoose.connection.db;
    
    const usersCount = await db.collection("users").countDocuments();
    const patientsCount = await db.collection("patients").countDocuments();
    const appointmentsCount = await db.collection("appointments").countDocuments();
    const visitsCount = await db.collection("visits").countDocuments();
    
    console.log("Users Count:", usersCount);
    console.log("Patients Count:", patientsCount);
    console.log("Appointments Count:", appointmentsCount);
    console.log("Visits Count:", visitsCount);

    const doctors = await db.collection("users").find({ role: "doctor" }).toArray();
    console.log("Doctors in DB:", doctors.map(d => ({ id: d._id, name: d.name, email: d.email })));

    const appointments = await db.collection("appointments").find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("Latest 5 Appointments:", appointments);

    const visits = await db.collection("visits").find().sort({ createdAt: -1 }).limit(5).toArray();
    console.log("Latest 5 Visits:", visits);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
