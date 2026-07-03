import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

/**
 * Middleware to run validations and return formatted errors
 * @param {Array} validations 
 */
export const validate = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = [];
    errors.array().map((err) => extractedErrors.push({ [err.path]: err.msg }));

    console.error("Validation failed on path:", req.originalUrl, "Body:", req.body, "Errors:", extractedErrors);

    try {
      const fs = await import("fs");
      fs.appendFileSync(
        "c:/Users/Asus/OneDrive/Desktop/Aayu/backend/error_log.txt",
        `[VALIDATION ERROR] ${new Date().toISOString()} - Path: ${req.originalUrl}\nBody: ${JSON.stringify(req.body, null, 2)}\nErrors: ${JSON.stringify(extractedErrors, null, 2)}\n\n`
      );
    } catch (e) {
      // ignore
    }

    throw new ApiError(422, "Validation failed", extractedErrors);
  };
};
