import axios from "axios";
import { Request, Response } from "express";
import qs from "qs";
const appId = "657576830393437"; // Replace with your Instagram App ID
const appSecret = "152e8a450437f2af661073cf1233a978"; // Replace with your Instagram App Secret
const redirectUri = "https://api.prism2025.tech/instagram/auth/callback"; // Replace with your redirect URI
<<<<<<< HEAD
=======
>>>>>>> b3c0e52 (Added Auth, Database, Error handling, Validations)
// Step 1: Redirect user to Instagram OAuth
export const instaAuth = async (req: Request, res: Response) => {
  const {
    user: { userId },
    instaPref,
  } = req as any;
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      instaPref,
    },
  });
export const instaAuth = async (req: Request, res: Response) => {
  const {
    user: { userId },
    instaPref,
  } = req as any;
  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      instaPref,
    },
  });
  const scope = "instagram_business_basic,instagram_business_content_publish";
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURI(redirectUri)}&scope=${scope}&response_type=code`;
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURI(
    redirectUri
  )}&scope=${scope}&response_type=code`;
  res.redirect(authUrl);
};

// Step 2: Handle OAuth callback and exchange code for access token
export const instaCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ error: "Authorization code is missing" });
    return;
  }

  try {
<<<<<<< HEAD
    const tokenResponse = await axios.post(
      `https://api.instagram.com/oauth/access_token`,
      qs.stringify({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
=======
    const tokenResponse = await axios.get(
      `https://graph.facebook.com/v19.0/oauth/access_token`,
>>>>>>> b3c0e52 (Added Auth, Database, Error handling, Validations)
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const { access_token, user_id } = tokenResponse.data;
    // console.log("token response is -", tokenResponse);
    // const accessToken = tokenResponse.data.access_token;
    const longtoken = await axios.get(
      "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${access_token}"
    );
    const long_access_token = longtoken.data.access_token;

    // Save long access token to database
    const {
      user: { userId },
    } = req as any;
    await prisma.user.update({
      where: { id: userId },
      data: {
        instaAccessToken: long_access_token,
        instaUserId: user_id
      },
    });

    res.json({
      message: "Instagram authorization successfull",
      long_access_token,
      message: "Instagram authorization successful",
      long_access_token,
      access_token,
      user_id,
    });
  } catch (error) {
    console.log("Error is - ", error);
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
  console.log("Create post controller hit");

  try {
    // Step 3.1: Get Instagram user ID
    const userResponse = await axios.get(
      `https://graph.facebook.com/v19.0/me/accounts`,
      {
        params: { access_token: accessToken },
      }
    );
    console.log("userResponse = ", userResponse);

    const instagramAccountId = userResponse.data.data[0]?.id;
    console.log("instagramAccountId = ", instagramAccountId);

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
      }
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
      }
    );

    res.json({ success: true, postId: publishResponse.data.id });
    return;
  } catch (error) {
    res.status(500).json({ error: "Failed to create Instagram post" });
  }
};
