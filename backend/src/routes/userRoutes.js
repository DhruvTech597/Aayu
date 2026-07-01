import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  sendOTP,
  loginOTP,
  verifyAbhaId,
} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-abha", verifyAbhaId);
router.post("/otp/send", sendOTP);
router.post("/otp/login", loginOTP);
router.get("/profile", verifyJWT, getProfile);
router.put("/profile", verifyJWT, updateProfile);

export default router;
