import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { Request, Response, NextFunction } from "express";
import { UnauthenticatedError } from "../utils/errors";  

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "defaultjwtsecret:3";
const JWT_LIFETIME = process.env.JWT_LIFETIME || "30d";
const SALT_ROUNDS: number = parseInt(process.env.SALT_ROUNDS || "10");

export const generateToken = (email: string, id: number) => {
  return jwt.sign({ email, id }, JWT_SECRET, { expiresIn: "30d" });
};

export const hashPassword = async (password: string) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePasswords = async (
  candidatePassword: string,
  hashedPassword: string
) => {
  return bcrypt.compare(candidatePassword, hashedPassword);
};

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  // JWT exchange using cookies

  // const token = req.cookies.token;

  // if (!token) {
  //   throw new UnauthenticatedError("Token not found");
  // }
  // jwt.verify(token, JWT_SECRET, (err: any, payload: any) => {
  //   if (err) {
  //     throw new UnauthenticatedError("Authentication invalid");
  //   }
  //   (req as any).user = payload;
  //   next();
  // });

  // JWT exchange in request header

  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader.startsWith("Bearer")) {
    throw new UnauthenticatedError("Authentication invalid");
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload !== "string") {
      (req as any).user = { userId: (payload as jwt.JwtPayload).userId };
    }
    next();
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid");
  }
};

export const verifyJWT = (token: string) => {
  const payload = jwt.verify(token, JWT_SECRET);
  if (typeof payload !== "string") {
    return { userId: (payload as jwt.JwtPayload).userId };
  }
};
