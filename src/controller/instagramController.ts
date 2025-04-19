import axios from "axios";
import { Request, Response } from "express";

const appId = "657576830393437"; // Replace with your Instagram App ID
const appSecret = "152e8a450437f2af661073cf1233a978"; // Replace with your Instagram App Secret
const redirectUri = "http://localhost:5173/auth/callback"; // Replace with your redirect URI
console.log("testing if its pushed to deployed server");
// Step 1: Redirect user to Instagram OAuth
export const instaAuth = (req: Request, res: Response) => {
  const scope = "instagram_basic,instagram_content_publish";
  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;
  res.redirect(authUrl);
};

// Step 2: Handle OAuth callback and exchange code for access token
export const instaCallback = async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code) {
    res.status(400).json({ error: "Authorization code is missing" });
    return;
  }

  try {
    const tokenResponse = await axios.post(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
      null,
      {
        params: {
          client_id: appId,
          client_secret: appSecret,
          redirect_uri: redirectUri,
          code,
        },
      },
    );

    const accessToken = tokenResponse.data.access_token;
    res.json({ accessToken });
  } catch (error) {
    res.status(500).json({ error: "Failed to exchange code for access token" });
  }
};

// Step 3: Create a post on Instagram
export const createPost = async (req: Request, res: Response) => {
  const { accessToken, imageUrl, caption } = req.body;

  if (!accessToken || !imageUrl || !caption) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    // Step 3.1: Get Instagram user ID
    const userResponse = await axios.get(
      `https://graph.facebook.com/v19.0/me/accounts`,
      {
        params: { access_token: accessToken },
      },
    );

    const instagramAccountId = userResponse.data.data[0]?.id;

    if (!instagramAccountId) {
      res.status(400).json({ error: "Instagram account not found" });
      return;
    }

    // Step 3.2: Create a media object
    const mediaResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption,
          access_token: accessToken,
        },
      },
    );

    const mediaId = mediaResponse.data.id;

    // Step 3.3: Publish the media object
    const publishResponse = await axios.post(
      `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: mediaId,
          access_token: accessToken,
        },
      },
    );

    res.json({ success: true, postId: publishResponse.data.id });
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to create Instagram post" });
  }
};
