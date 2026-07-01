import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import axios from "axios";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

const getReceptionistHash = async () => {
  const conn = await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const user = await db.collection("users").findOne({ email: "reception@test.com" });
  await mongoose.disconnect();
  return user ? user.password : null;
};

const resetReceptionist = async () => {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const hashedPassword = await bcrypt.hash("password123", 10);
  await db.collection("users").updateOne(
    { email: "reception@test.com" },
    { $set: { password: hashedPassword } }
  );
  await mongoose.disconnect();
};

const run = async () => {
  try {
    console.log("1. Resetting receptionist to password123...");
    await resetReceptionist();
    
    let hash = await getReceptionistHash();
    console.log("Initial Hash in DB:", hash);

    console.log("2. Logging in receptionist...");
    const loginRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: "reception@test.com",
      password: "password123"
    });
    const token = loginRes.data.data.token;
    console.log("Login success. Token acquired.");

    hash = await getReceptionistHash();
    console.log("Hash after login:", hash);

    console.log("3. Onboarding a patient...");
    const randomPhone = String(Math.floor(6000000000 + Math.random() * 4000000000));
    const randomAbha = "ABHA-" + Math.floor(100000 + Math.random() * 900000);
    const patientPayload = {
      fullName: "Test Corruption Patient",
      phone: randomPhone,
      age: 30,
      gender: "Female",
      bloodGroup: "A+",
      abhaId: randomAbha,
      allergies: [],
      chronicDiseases: [],
      address: "456 Avenue"
    };

    const patientRes = await axios.post("http://localhost:5000/api/v1/patients/create", patientPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Patient created! ID:", patientRes.data.data._id);

    hash = await getReceptionistHash();
    console.log("Hash after patient onboarding:", hash);

    console.log("4. Scheduling an appointment...");
    // Let's find a doctor
    const docRes = await axios.get("http://localhost:5000/api/v1/doctor/list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const doctorId = docRes.data.data[0]?._id;
    console.log("Found doctor ID:", doctorId);

    const apptPayload = {
      patientId: patientRes.data.data._id,
      doctorId: doctorId,
      appointmentDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      reason: "Follow up checking",
      notes: "Check for side effects"
    };

    const apptRes = await axios.post("http://localhost:5000/api/v1/appointments", apptPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Appointment scheduled successfully!");

    hash = await getReceptionistHash();
    console.log("Hash after scheduling appointment:", hash);

    console.log("5. Checking if login still works...");
    const loginCheckRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: "reception@test.com",
      password: "password123"
    });
    console.log("Login check status:", loginCheckRes.data.success ? "SUCCESS" : "FAILED");

  } catch (err) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
    console.error("Error message:", err.message);
    
    const hash = await getReceptionistHash();
    console.log("Hash at error:", hash);
  }
};

run();
