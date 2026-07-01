import axios from "axios";

const run = async () => {
  try {
    console.log("Logging in as receptionist...");
    const loginRes = await axios.post("http://localhost:5000/api/v1/users/login", {
      email: "reception@test.com",
      password: "password123"
    });

    const token = loginRes.data.data.token;
    console.log("Login success!");

    console.log("Fetching doctors list...");
    const docRes = await axios.get("http://localhost:5000/api/v1/doctor/list", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Doctors list status:", docRes.status);
    console.log("Doctors list data:", JSON.stringify(docRes.data, null, 2));

  } catch (err) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
    console.error("Error message:", err.message);
  }
};

run();
