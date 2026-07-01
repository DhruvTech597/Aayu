import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import User from "../models/User.js";
import Patient from "../models/Patient.js";

/**
 * Middleware to verify JWT and attach user to request
 */
export const verifyJWT = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") || req.query?.token;

  if (!token) {
    throw new ApiError(401, "Unauthorized request - No token provided");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decodedToken?.id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    if (user.role === "patient" && !user.patientId) {
      let patient;
      if (user.phone) {
        patient = await Patient.findOne({ phone: user.phone });
      }
      if (!patient) {
        patient = await Patient.findOne({ fullName: user.name });
      }
      if (!patient) {
        // Create fallback patient clinical record
        const fallbackPhone = user.phone || `000000${Math.floor(1000 + Math.random() * 9000)}`;
        patient = await Patient.create({
          fullName: user.name,
          phone: fallbackPhone,
          age: 30,
          gender: "Male"
        });
      }
      user.patientId = patient._id;
      if (!user.phone && patient.phone) {
        user.phone = patient.phone;
      }
      await user.save();
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 * Middleware to restrict access based on roles
 * @param  {...string} roles 
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Role: ${req.user.role} is not allowed to access this resource`
      );
    }
    next();
  };
};
