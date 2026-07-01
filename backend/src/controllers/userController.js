import User from "../models/User.js";
import Patient from "../models/Patient.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/**
 * Register a new user
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, age, gender, abhaId } = req.body;

  const normalizedEmail = email ? email.toLowerCase().trim() : "";

  if (role === "patient") {
    if (!abhaId) {
      throw new ApiError(400, "ABHA ID is required for patient registration");
    }

    const patient = await Patient.findOne({ abhaId: abhaId.trim() });
    if (!patient) {
      throw new ApiError(404, "No onboarded patient found with this ABHA ID. Please contact clinic reception.");
    }

    const existedUserByEmail = await User.findOne({ email: normalizedEmail });
    if (existedUserByEmail && String(existedUserByEmail.patientId) !== String(patient._id)) {
      throw new ApiError(409, "User with this email already exists");
    }

    let user = await User.findOne({ patientId: patient._id });
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      if (!user.email.endsWith("@aayu.connect")) {
        throw new ApiError(409, "This patient account is already registered. Please login.");
      }
      user.email = normalizedEmail;
      user.password = hashedPassword;
      user.name = patient.fullName;
      user.phone = patient.phone;
      await user.save();
    } else {
      user = await User.create({
        name: patient.fullName,
        email: normalizedEmail,
        password: hashedPassword,
        role: "patient",
        phone: patient.phone,
        patientId: patient._id,
      });
    }

    const createdUser = await User.findById(user._id).select("-password");
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "Patient registered successfully"));
  }

  // Non-patient registration logic
  const existedUser = await User.findOne({ email: normalizedEmail });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: role || "doctor",
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

/**
 * Verify ABHA ID during Patient Registration
 */
export const verifyAbhaId = asyncHandler(async (req, res) => {
  const { abhaId } = req.body;
  if (!abhaId) {
    throw new ApiError(400, "ABHA ID is required");
  }

  const patient = await Patient.findOne({ abhaId: abhaId.trim() });
  if (!patient) {
    throw new ApiError(404, "No onboarded patient found with this ABHA ID. Please contact clinic reception.");
  }

  // Check if patient already registered
  const user = await User.findOne({ patientId: patient._id });
  if (user && !user.email.endsWith("@aayu.connect")) {
    throw new ApiError(409, "This patient is already registered. Please login.");
  }

  return res.status(200).json(
    new ApiResponse(200, {
      fullName: patient.fullName,
      phone: patient.phone,
      age: patient.age,
      gender: patient.gender,
      abhaId: patient.abhaId,
    }, "ABHA ID verified successfully. You can complete your registration.")
  );
});

/**
 * Login user
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7h",
  });

  const loggedInUser = await User.findById(user._id).select("-password");

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        user: loggedInUser,
        token,
      },
      "User logged in successfully"
    )
  );
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User profile fetched successfully"));
});

/**
 * Update general user profile (name and email)
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { name, email, notificationSettings, themePreference } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (name) user.name = name;
  if (email) {
    const duplicateUser = await User.findOne({ email, _id: { $ne: userId } });
    if (duplicateUser) {
      throw new ApiError(409, "Email is already taken by another account");
    }
    user.email = email;
  }

  if (notificationSettings !== undefined) {
    user.notificationSettings = {
      aiCriticalAlerts: notificationSettings.aiCriticalAlerts !== undefined ? notificationSettings.aiCriticalAlerts : user.notificationSettings.aiCriticalAlerts,
      appointmentReminders: notificationSettings.appointmentReminders !== undefined ? notificationSettings.appointmentReminders : user.notificationSettings.appointmentReminders,
      systemUpdates: notificationSettings.systemUpdates !== undefined ? notificationSettings.systemUpdates : user.notificationSettings.systemUpdates,
    };
  }

  if (themePreference !== undefined) {
    user.themePreference = themePreference;
  }

  await user.save();
  const updatedUser = await User.findById(userId).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

// In-memory OTP store (phone -> { code, expiresAt })
const otpStore = {};

/**
 * Ensures a Patient clinical record is linked to a User login account.
 */
export const ensurePatientUser = async (patient) => {
  let user = await User.findOne({ patientId: patient._id });
  if (!user) {
    // Check if phone matches any existing user to avoid duplication
    user = await User.findOne({ phone: patient.phone });
    if (user) {
      user.patientId = patient._id;
      user.role = "patient";
      await user.save();
    } else {
      const generatedEmail = `${patient.phone}@aayu.connect`;
      const defaultPassword = patient.phone; // default password is phone number
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      user = await User.create({
        name: patient.fullName,
        email: generatedEmail,
        password: hashedPassword,
        role: "patient",
        phone: patient.phone,
        patientId: patient._id,
      });
    }
  }
  return user;
};

/**
 * Send Simulated OTP Code to Patient
 */
export const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
  const patient = await Patient.findOne({ phone: cleanPhone });
  if (!patient) {
    throw new ApiError(404, "Phone number is not registered as a patient in MedAI Connect. Please contact reception.");
  }

  // Auto-provision User if not exists
  await ensurePatientUser(patient);

  // Generate simulated 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[cleanPhone] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  };

  console.log(`[Simulated OTP] Verification code for ${cleanPhone} is ${otp}`);

  return res.status(200).json(
    new ApiResponse(200, { otp, phone: cleanPhone }, `OTP verification code sent to ${phone}. (Code: ${otp})`)
  );
});

/**
 * Login Patient using Phone Number + OTP
 */
export const loginOTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;
  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP code are required");
  }

  const cleanPhone = phone.replace(/[\s\-\(\)]/g, "");

  // Verify OTP
  const stored = otpStore[cleanPhone];
  if (!stored) {
    throw new ApiError(400, "No OTP sent to this phone number");
  }

  if (stored.expiresAt < Date.now()) {
    delete otpStore[cleanPhone];
    throw new ApiError(400, "OTP code has expired. Please request a new one.");
  }

  if (stored.otp !== otp && otp !== "123456") { // allow 123456 as backup bypass
    throw new ApiError(400, "Invalid OTP code");
  }

  // Clear OTP from store after successful verify
  delete otpStore[cleanPhone];

  // Find the patient and verify/ensure User
  const patient = await Patient.findOne({ phone: cleanPhone });
  if (!patient) {
    throw new ApiError(404, "Associated patient record not found");
  }

  const user = await ensurePatientUser(patient);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7h",
  });

  const loggedInUser = await User.findById(user._id).select("-password").populate("patientId");

  return res.status(200).json(
    new ApiResponse(
      200, 
      {
        user: loggedInUser,
        token,
      }, 
      "Patient authenticated successfully"
    )
  );
});
