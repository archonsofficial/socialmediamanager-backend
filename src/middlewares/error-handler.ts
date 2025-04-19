import { ErrorRequestHandler } from "express";
import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  interface CustomError extends Error {
    statusCode?: number;
  }

  let customError = {
    statusCode: (err as CustomError).statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || "Something went wrong, please try again later!",
  };

  res.status(customError.statusCode).json({ msg: customError.msg });
};
