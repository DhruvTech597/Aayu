import axios from "axios";

const run = async () => {
  try {
    console.log("Logging in...");
    const loginRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: "reception@test.com",
      password: "password123"
    });
    const token = loginRes.data.data.token;
    console.log("Login success.");

    console.log("Sending appointment request...");
    const res = await axios.post("http://localhost:5000/api/v1/appointments", {
      patientId: "6a329b1b07e6c7b276eb5e8f", // John Doe created by subagent
      doctorId: "6a19843166277ed5fab0f571",
      appointmentDate: "2026-06-18T10:00",
      reason: "Routine Checkup"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success! Data:", res.data);
  } catch (err) {
    console.error("Status:", err.response?.status);
    console.error("Data:", err.response?.data);
    console.error("Message:", err.message);
  }
};

run();
