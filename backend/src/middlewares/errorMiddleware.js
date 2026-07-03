import { ApiError } from "../utils/ApiError.js";
import fs from "fs";

/**
 * Global Error Handler Middleware
 */
const errorMiddleware = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    message = err.message || "Internal Server Error";
  }

  const response = {
    success: false,
    message,
    errors: err.errors || [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  try {
    fs.appendFileSync(
      "c:/Users/Asus/OneDrive/Desktop/Aayu/backend/error_log.txt",
      `[SERVER ERROR] ${new Date().toISOString()} - Status: ${statusCode} - Path: ${req.originalUrl}\nMessage: ${message}\nStack: ${err.stack}\nErrors: ${JSON.stringify(err.errors || [], null, 2)}\n\n`
    );
  } catch (e) {
    // ignore
  }

  res.status(statusCode).json(response);
};

export { errorMiddleware };
