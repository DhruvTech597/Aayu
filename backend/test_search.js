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

    console.log("Searching for patient 'dhruv'...");
    const searchRes = await axios.get("http://localhost:5000/api/v1/patients/search?q=dhruv", {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Search result status:", searchRes.status);
    console.log("Search result data:", JSON.stringify(searchRes.data, null, 2));

  } catch (err) {
    console.error("API error status:", err.response?.status);
    console.error("API error data:", err.response?.data);
    console.error("Error message:", err.message);
  }
};

run();
