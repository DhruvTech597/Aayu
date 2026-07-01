import axios from "axios";

const run = async () => {
  try {
    const randomEmail = `recept_${Math.floor(1000 + Math.random() * 9000)}@test.com`;
    console.log(`Registering a new receptionist: ${randomEmail}`);
    const regRes = await axios.post("http://localhost:5000/api/v1/users/register", {
      name: "Test Receptionist",
      email: randomEmail,
      password: "password123",
      role: "receptionist"
    });
    console.log("Registration success:", regRes.data.success);

    console.log("Logging in as receptionist...");
    const loginRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: randomEmail,
      password: "password123"
    });

    const token = loginRes.data.data.token;
    console.log("Login success! Token extracted.");

    console.log("Onboarding new patient...");
    const randomPhone = "+91" + Math.floor(1000000000 + Math.random() * 9000000000);
    const randomAbha = "ABHA-" + Math.floor(100000 + Math.random() * 900000);
    const patientPayload = {
      fullName: "Test Patient Autocomplete",
      phone: randomPhone,
      age: 25,
      gender: "Male",
      bloodGroup: "O+",
      abhaId: randomAbha,
      allergies: [],
      chronicDiseases: [],
      address: "123 Street"
    };

    const patientRes = await axios.post("http://localhost:5000/api/v1/patients/create", patientPayload, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Patient onboarded successfully:", patientRes.data);

    console.log("Updating profile...");
    const profileUpdateRes = await axios.put("http://localhost:5000/api/v1/users/profile", {
      name: "Updated Name",
      email: randomEmail,
      notificationSettings: {
        aiCriticalAlerts: true,
        appointmentReminders: true,
        systemUpdates: false
      },
      themePreference: "dark"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Profile updated successfully:", profileUpdateRes.data.success);

    console.log("Logging in again with the registered receptionist to check if password changed...");
    const login2Res = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: randomEmail,
      password: "password123"
    });
    console.log("Second login success:", login2Res.data.success);

  } catch (err) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
    console.error("Error message:", err.message);
  }
};

run();
