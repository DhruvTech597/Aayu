import axios from "axios";

const run = async () => {
  try {
    console.log("Logging in as receptionist...");
    const loginRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: "reception@test.com",
      password: "password123"
    });

    const token = loginRes.data.data.token;
    console.log("Login success! Token:", token.substring(0, 15) + "...");

    console.log("Fetching profile...");
    const profileRes = await axios.get("http://localhost:5000/api/v1/users/profile", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile fetched successfully:", profileRes.data.data.name);

    console.log("Onboarding new patient...");
    const randomPhone = String(Math.floor(6000000000 + Math.random() * 4000000000));
    const randomAbha = "ABHA-" + Math.floor(100000 + Math.random() * 900000);
    const patientPayload = {
      fullName: "Test Autocomplete Patient",
      phone: randomPhone,
      age: 25,
      gender: "Male",
      bloodGroup: "O+",
      abhaId: randomAbha,
      allergies: ["dust"],
      chronicDiseases: [],
      address: "123 Street"
    };

    const patientRes = await axios.post("http://localhost:5000/api/v1/patients/create", patientPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Patient onboarded successfully:", patientRes.data);

  } catch (err) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
    console.error("Error message:", err.message);
  }
};

run();
