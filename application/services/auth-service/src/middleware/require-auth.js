import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication token required.",
      },
    });
  }

  const token = authorization.slice(7).trim();

  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "cloudops-auth",
      audience: "cloudops-api",
    });

    if (typeof payload !== "object" || !payload.sub) {
      throw new Error("Invalid token payload");
    }

    req.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    return res.status(401).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token.",
      },
    });
  }
}