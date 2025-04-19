import dotenv from "dotenv";
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../db/connect";
import jwt from "jsonwebtoken";
import nodeemailer from "nodemailer";
import {
  comparePasswords,
  generateToken,
  hashPassword,
} from "../middlewares/authentication";
import { NotFoundError, UnauthenticatedError } from "../utils/errors";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "defaulttokensecret";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const EMAIL = process.env.EMAIL || "support@prism2025.tech";
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || "fakepassword";

export const register = async (req: Request, res: Response) => {
  const {
    body: { email, password },
  } = req;
  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: { ...req.body, password: hashedPassword },
    select: { id: true },
  });
  const token = generateToken(email, user.id);

  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "lax",
  //   maxAge: 30 * 24 * 60 * 60 * 1000,
  //   path: "/",
  // });
  res
    .status(StatusCodes.CREATED)
    .json({ msg: "Registered successfully", token });
};

export const login = async (req: Request, res: Response) => {
  const {
    body: { email, password },
  } = req;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { password: true, id: true },
  });

  if (!user) throw new NotFoundError("User not found");

  if (!(await comparePasswords(password, user.password))) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const token = generateToken(email, user.id);
  // res.cookie("token", token, {
  //   httpOnly: true,
  //   secure: true,
  //   sameSite: "lax",
  //   maxAge: 30 * 24 * 60 * 60 * 1000,
  //   path: "/",
  // });
  res.status(StatusCodes.OK).json({ msg: "Login successful", token });
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const {
    body: { email },
  } = req;
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) throw new NotFoundError("User does not exist!");

  const secret = JWT_SECRET + user.password;
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "1h",
  });
  const resetUrl = `${FRONTEND_URL}/resetPassword/${user.id}/${token}`;

  const transporter = nodeemailer.createTransport({
    host: "smtp.tital.email",
    port: 465,
    secure: true,
    auth: {
      user: EMAIL,
      pass: EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    to: user.email,
    from: EMAIL,
    subject: "Password Reset Request",
    text: `You are receiving this because you have requested the reset of the password for your account. \n\n
      Please click on the following link to complete the process: \n\n
      ${resetUrl} \n\n
      If you did not request this, please ignore this email`,
  };
  await transporter.sendMail(mailOptions);
  res.status(StatusCodes.OK).json({ msg: "Password reset link sent" });
};

export const resetPassword = async (req: Request, res: Response) => {
  const {
    params: { id, token },
    body: { password },
  } = req;

  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      password: true,
    },
  });

  if (!user) throw new NotFoundError("User not found");

  const verify = jwt.verify(token, JWT_SECRET);
  const hashedPassword = await hashPassword(password);

  await prisma.user.update({
    where: {
      id: id,
    },
    data: { password: hashedPassword },
  });

  res
    .status(StatusCodes.OK)
    .json({ msg: "Password has been reset successfully" });
};
