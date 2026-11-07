import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    createdAt: user.created_at,
  };
}

function createAccessToken(user) {
  return jwt.sign(
    { role: user.role },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN,
      issuer: "cloudops-auth",
      audience: "cloudops-api",
    }
  );
}

// REGISTER USER
export async function register(req, res) {
  const { fullName, email, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  const passwordHash = await bcrypt.hash(
    password,
    env.BCRYPT_ROUNDS
  );

  try {
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, full_name, role, created_at`,
      [fullName, normalizedEmail, passwordHash]
    );

    const user = result.rows[0];

    const accessToken = createAccessToken(user);

    return res.status(201).json({
      data: {
        user: toPublicUser(user),
        token: {
          accessToken,
          tokenType: "Bearer",
          expiresIn: env.JWT_EXPIRES_IN,
        },
      },
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "An account with this email already exists.",
        },
      });
    }

    throw error;
  }
}

// LOGIN USER
export async function login(req, res) {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  const result = await pool.query(
    `SELECT id, email, full_name, role,
            password_hash, created_at
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatches) {
    return res.status(401).json({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      },
    });
  }

  const accessToken = createAccessToken(user);

  return res.status(200).json({
    data: {
      user: toPublicUser(user),
      token: {
        accessToken,
        tokenType: "Bearer",
        expiresIn: env.JWT_EXPIRES_IN,
      },
    },
  });
}

// GET AUTHENTICATED USER
export async function getMe(req, res) {
  const result = await pool.query(
    `SELECT id, email, full_name, role, created_at
     FROM users
     WHERE id = $1`,
    [req.auth.userId]
  );

  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      error: {
        code: "USER_NOT_FOUND",
        message: "The authenticated account no longer exists.",
      },
    });
  }

  return res.status(200).json({
    data: {
      user: toPublicUser(user),
    },
  });
}