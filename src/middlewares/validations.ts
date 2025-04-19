import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../db/connect";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";;


const loginSchema = z.object({
  email: z.string().email({ message: "invalid email" }),
  password: z
    .string()
    .min(8, { message: "password must be 8 characters long" })
    .max(20, { message: "password can only be 20 characters long" }),
});

const registerSchema = z.object({
  name: z.string({ message: "name is required" }),
  password: z
    .string()
    .min(8, { message: "password must be 8 characters long" })
    .max(20, { message: "password can only be 20 characters long" }),
  university: z.string(),
  course: z.enum(["B_Tech", "M_Tech", "BCA", "MCA"], {
    message: "invalid course",
  }),
  department: z.enum(["CSE", "IT", "ECE", "EE", "ME", "CE", "None"], {
    message: "invalid department",
  }),
  year: z.enum(["I", "II", "III", "IV"], { message: "invalid academic year" }),
  email: z.string().email({ message: "invalid email" }),
  phone: z.string().length(10, { message: "invalid phone number" }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "invalid gender" }),
});

//********* Middlewares *********//

export const registerValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parseBody = registerSchema.safeParse(req.body);
  if (!parseBody.success) {
    const errorMessage = parseBody.error.issues
      .map((issue, index) => {
        if (index == 0) {
          return (
            issue.message[0].slice(0, 1).toUpperCase() + issue.message.slice(1)
          );
        } else {
          return issue.message;
        }
      })
      .join(", ");
    throw new BadRequestError(errorMessage);
  }
  req.body = parseBody.data;
  next();
};

export const loginValidation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const parseBody = loginSchema.safeParse(req.body);
  if (!parseBody.success) {
    const errorMessage = parseBody.error.issues
      .map((issue, index) => {
        if (index == 0) {
          return issue.message[0].toUpperCase() + issue.message.slice(1);
        } else {
          return issue.message;
        }
      })
      .join(", ");
    throw new BadRequestError(errorMessage);
  }
  req.body = parseBody.data;
  next();
};

export const existingUserValidation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, phone } = req.body;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (user) {
    throw new ConflictError("User already exists");
  }
  next();
};
