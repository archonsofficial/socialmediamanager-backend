import { Router } from "express";
import {
  loginValidation,
  registerValidation,
  existingUserValidation,
} from "../middlewares/validations";
import {
  login,
  register,
  resetPassword,
  requestPasswordReset,
} from "../controller/auth";

export const authRoute = Router();

authRoute.post("/login", loginValidation, login);
authRoute.post(
  "/register",
  registerValidation,
  existingUserValidation,
  register
);
authRoute.post("/resetPassword", requestPasswordReset);
authRoute.post("/resetPassword/:id/:token", resetPassword);
