import axios from "axios";
import { Request, Response } from "express";
import qs from "qs";
import { stringify } from "querystring";
import prisma from "../db/connect";
const appId = "657576830393437"; // Replace with your Instagram App ID
const appSecret = "152e8a450437f2af661073cf1233a978"; // Replace with your Instagram App Secret
const redirectUri = "https://api.prism2025.tech/instagram/auth/callback"; // Replace with your redirect URI
// Step 1: Redirect user to Instagram OAuth
export const instaAuth = async (req: Request, res: Response) => {
  const {
    user: { userId },
    query
  } = req as any;
  const instaPref = Array.isArray(query.instaPref) ? query.instaPerf : [query.instaPerf];
  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        instaPref,
      },
    });
    const scope = "instagram_business_basic,instagram_business_content_publish";
    const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURI(
      redirectUri
    )}&scope=${scope}&response_type=code`;
    res.redirect(authUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({error:"Internal server error during Instagram auth"});
  }
};
// Step 2: Handle OAuth callback and exchange code for access token
export const instaCallback = async (req: Request, res: Response) => {
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ error: "Authorization code is missing" });
    return;
  }

  try {
    const tokenResponse = await axios.post(
      `https://api.instagram.com/oauth/access_token`,
      qs.stringify({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
    );

    const { access_token, user_id } = tokenResponse.data;
    // console.log("token response is -", tokenResponse);
    // const accessToken = tokenResponse.data.access_token;
    const longtoken = await axios.get(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${access_token}`
    );
    const long_access_token = longtoken.data.access_token;

    // Save long access token to database
    const {
      user: { userId },
    } = req as any;
    await prisma.user.update({
      where: { id: userId },
      data: {
        instaAccessToken: stringify(long_access_token),
        instaUserId: user_id
      },
    });

    res.json({
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

export const createPost = async (req: Request, res: Response) => {
  const { accessToken, imageUrl, caption } = req.body;

  if (!accessToken || !imageUrl || !caption) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  console.log("Create post controller hit");
  console.log("input data - ", accessToken, imageUrl, caption);

  try {
    console.log("Step 1: Getting Instagram user info...");
    // Step 1: Get Instagram user info
    const userResponse = await axios.get(
      `https://graph.instagram.com/v22.0/me`,
      {
        params: {
          access_token: accessToken,
          fields: "id,username,account_type",
        },
      },
    );
    console.log("userResponse = ", userResponse.data);
// Corrected line
const instagramAccountId = userResponse.data.id;
    console.log("instagramAccountId = ", instagramAccountId);
    const accountType = userResponse.data.account_type;

    if (!instagramAccountId) {
      res.status(400).json({ error: "Instagram account not found" });
      return;
    }
    if (accountType !== "BUSINESS" && accountType !== "MEDIA_CREATOR") { // Allow MEDIA_CREATOR too
      console.warn(`Account type is ${accountType}. Ensure permissions allow publishing.`);
      // Potentially block if needed:
      res.status(400).json({ error: "Instagram account must be BUSINESS or MEDIA_CREATOR to publish." });
      return;
    }

    // Step 2: Create a container (media object)
    const mediaResponse = await axios.post(
      `https://graph.instagram.com/v22.0/${instagramAccountId}/media`,
      null,
      {
        params: {
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        },
      },
    );

    console.log("Media response:", mediaResponse.data);
    const containerId = mediaResponse.data.id;

    if (!containerId) {
      res.status(400).json({
        error: "Failed to create media container",
        details: mediaResponse.data,
      });
      return;
    }

    // Step 3: Check container status before publishing
    let containerStatus;
    let statusCheckAttempts = 0;
    const maxStatusCheckAttempts = 10;

    do {
      const statusResponse = await axios.get(
        `https://graph.instagram.com/v22.0/${containerId}`,
        {
          params: {
            fields: "status_code",
            access_token: accessToken,
          },
        },
      );

      containerStatus = statusResponse.data.status_code;
      console.log(
        `Container status (attempt ${statusCheckAttempts + 1}):`,
        containerStatus,
      );

      if (containerStatus === "FINISHED") {
        break;
      } else if (containerStatus === "ERROR") {
        res.status(400).json({
          error: "Error creating media container",
          details: statusResponse.data,
        });
        return;
      }

      statusCheckAttempts++;
      // Wait for 2 seconds before checking again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } while (statusCheckAttempts < maxStatusCheckAttempts);

    if (containerStatus !== "FINISHED") {
      res.status(400).json({
        error: "Media container processing timed out",
        status: containerStatus,
      });
      return;
    }

    // Step 4: Publish the container
    const publishResponse = await axios.post(
      `https://graph.instagram.com/v22.0/${instagramAccountId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken,
        },
      },
    );

    console.log("Publish response:", publishResponse.data);
    const newPostId = publishResponse.data.id
    const {user:{userId}} = req as any;
    await prisma.user.update({
      where: {
        id: userId
      }, 
      data: {
        instaPostId: newPostId
      }
    })

    // Step 5: Return success response with the Instagram post ID
    res.json({
      success: true,
      message: "Instagram post created successfully",
      postId: publishResponse.data.id,
    });
    return;
  } catch (error: any) {
    console.error(
      "Error creating Instagram post:",
      error.response?.data || error.message,
    );
    console.log("error is - ", error);
    res.status(500).json({
      error: "Failed to create Instagram post",
      details: error.response?.data,
    });
    return;
  }
}

export const getPostInsights = async (req: Request, res: Response) => {
  // const { user: { userId } } = req as any;
  // const user = await prisma.user.findUnique({ where: { id: userId } });
  // const accessToken = user?.instaAccessToken;
  // const postId = user?.instaPostId; 
  const {postId, accessToken} = req.body
  if (!postId || !accessToken) {
    res.status(400).json({ error: "Missing postId or accessToken" });
    return
  }

  // Common metrics: engagement, impressions, reach, saved, video_views (if video)
  const metrics = "impressions, likes, shares, comments, replies, total_interactions, profile_visits, reach"; // Add/remove metrics as needed

  try {
    console.log(`Fetching insights for post ID: ${postId}`);

    const insightsResponse = await axios.get(
      `https://graph.instagram.com/v22.0/${postId}/insights`,
      {
        params: {
          metric: metrics,
          access_token: accessToken,
        },
      }
    );

    console.log("Insights response:", insightsResponse.data);

    const insightsData = insightsResponse.data.data;

    // Optional: Format the data for easier consumption on the frontend
    const formattedInsights = insightsData.reduce((acc: any, insight: any) => {
      acc[insight.name] = insight.values[0].value;
      return acc;
    }, {});


    res.json({
      success: true,
      message: "Post insights retrieved successfully",
      postId: postId,
      insights: formattedInsights, 
    });
  } catch (error: any) {
    console.error(
      "Error fetching Instagram post insights:",
      error.response?.data || error.message
    );
    res.status(error.response?.status || 500).json({
      error: "Failed to fetch Instagram post insights",
      details: error.response?.data || { message: error.message },
    });
  }
};

