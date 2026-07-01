import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dotenv.config();

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const u = await User.findOne({ email: "reception@test.com" });
  console.log("User password hash in DB:", u.password);
  const matchDirect = await bcrypt.compare("password123", u.password);
  console.log("Compare in script:", matchDirect);
  await mongoose.disconnect();
};
run();
