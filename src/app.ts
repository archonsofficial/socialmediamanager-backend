import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import instagramRouter from "./routes/instagramRoutes";
import { auth } from "./middlewares/authentication";
import { authRoute } from "./routes/authRoutes";

const app = express();
app.use(express.json());
// app.use(cookieParser());

const allowedOrigins = ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use("/auth", authRoute);
app.use("/instagram", auth, instagramRouter);

app.get("/", (req, res) => {
  res.json({ message: "server is running on localhost" });
});

export default app;
