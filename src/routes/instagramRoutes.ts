import { Router } from "express";
import {
  instaAuth,
  instaCallback,
  createPost,
  getPostInsights,
} from "../controller/instagramController";

const instagramRouter = Router();

// Route to initiate Instagram OAuth
instagramRouter.get("/auth", instaAuth);

// Callback route to handle Instagram OAuth response
instagramRouter.get("/auth/callback", instaCallback);

// Route to create a post on Instagram
instagramRouter.post("/create-post", createPost);

instagramRouter.post('/insights', getPostInsights)
export default instagramRouter;
