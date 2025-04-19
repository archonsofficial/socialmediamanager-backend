import axios from "axios";
import { Request, Response } from "express";
import qs from "qs";
const appId = "657576830393437"; // Replace with your Instagram App ID
const appSecret = "152e8a450437f2af661073cf1233a978"; // Replace with your Instagram App Secret
const redirectUri = "https://api.prism2025.tech/instagram/auth/callback"; // Replace with your redirect URI
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
    const tokenResponse = await axios.post(
      `https://api.instagram.com/oauth/access_token`,
      qs.stringify({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
        code,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
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
// export const createPost = async (req: Request, res: Response) => {
// const { accessToken, imageUrl, caption } = req.body;

// if (!accessToken || !caption) {
//   res.status(400).json({ error: "Missing required fields" });
//   return;
// }
// console.log("Create post controller hit");

// try {
//   // Step 3.1: Get Instagram user ID
//   const userResponse = await axios.get(`https://graph.instagram.com/v22/`, {
//     params: { access_token: accessToken },
//   });
//   console.log("userResponse = ", userResponse);

//   const instagramAccountId = userResponse.data.data[0]?.id;
//   console.log("instagramAccountId = ", instagramAccountId);

//   if (!instagramAccountId) {
//     res.status(400).json({ error: "Instagram account not found" });
//     return;
//   }

//   // Step 3.2: Create a media object
//   const mediaResponse = await axios.post(
//     `https://graph.facebook.com/v19.0/${instagramAccountId}/media`,
//     null,
//     {
//       params: {
//         image_url: imageUrl,
//         caption,
//         access_token: accessToken,
//       },
//     },
//   );

//   const mediaId = mediaResponse.data.id;

//   // Step 3.3: Publish the media object
//   const publishResponse = await axios.post(
//     `https://graph.facebook.com/v19.0/${instagramAccountId}/media_publish`,
//     null,
//     {
//       params: {
//         creation_id: mediaId,
//         access_token: accessToken,
//       },
//     },
//   );

//   res.json({ success: true, postId: publishResponse.data.id });
//   return;
// } catch (error) {
//   res.status(500).json({ error: "Failed to create Instagram post" });
// }
// // };
// export const createPost = async (req: Request, res: Response) => {
//   const { accessToken, imageUrl, caption } = req.body;

//   if (!accessToken || !imageUrl || !caption) {
//     res.status(400).json({
//       error:
//         "Missing required fields: accessToken, imageUrl, and caption are required",
//     });
//     return;
//   }

//   console.log("Create post controller hit");

//   try {
//     // Step 1: Get Instagram user info
//     const userResponse = await axios.get(
//       `https://graph.instagram.com/v22.0/me`,
//       {
//         params: {
//           access_token: accessToken,
//           fields: "id,username,account_type",
//         },
//       },
//     );

//     console.log("User response:", userResponse.data);
//     const instagramUserId = userResponse.data.id;
//     const accountType = userResponse.data.account_type;

//     if (!instagramUserId) {
//       res.status(400).json({ error: "Instagram user ID not found" });
//       return;
//     }

//     if (accountType !== "BUSINESS" && accountType !== "CREATOR") {
//       res.status(400).json({
//         error:
//           "Instagram account must be Business or Creator type to publish content",
//       });
//       return;
//     }

//     // Step 2: Create a container (media object)
//     const mediaResponse = await axios.post(
//       `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
//       null,
//       {
//         params: {
//           image_url: imageUrl,
//           caption: caption,
//           access_token: accessToken,
//         },
//       },
//     );

//     console.log("Media response:", mediaResponse.data);
//     const containerId = mediaResponse.data.id;

//     if (!containerId) {
//       res.status(400).json({
//         error: "Failed to create media container",
//         details: mediaResponse.data,
//       });
//       return;
//     }

//     // Step 3: Check container status before publishing
//     let containerStatus;
//     let statusCheckAttempts = 0;
//     const maxStatusCheckAttempts = 10;

//     do {
//       const statusResponse = await axios.get(
//         `https://graph.instagram.com/v22.0/${containerId}`,
//         {
//           params: {
//             fields: "status_code",
//             access_token: accessToken,
//           },
//         },
//       );

//       containerStatus = statusResponse.data.status_code;
//       console.log(
//         `Container status (attempt ${statusCheckAttempts + 1}):`,
//         containerStatus,
//       );

//       if (containerStatus === "FINISHED") {
//         break;
//       } else if (containerStatus === "ERROR") {
//         res.status(400).json({
//           error: "Error creating media container",
//           details: statusResponse.data,
//         });
//         return;
//       }

//       statusCheckAttempts++;
//       // Wait for 2 seconds before checking again
//       await new Promise((resolve) => setTimeout(resolve, 2000));
//     } while (statusCheckAttempts < maxStatusCheckAttempts);

//     if (containerStatus !== "FINISHED") {
//       res.status(400).json({
//         error: "Media container processing timed out",
//         status: containerStatus,
//       });
//       return;
//     }

//     // Step 4: Publish the container
//     const publishResponse = await axios.post(
//       `https://graph.instagram.com/v22.0/${instagramUserId}/media_publish`,
//       null,
//       {
//         params: {
//           creation_id: containerId,
//           access_token: accessToken,
//         },
//       },
//     );

//     console.log("Publish response:", publishResponse.data);

//     // Step 5: Return success response with the Instagram post ID
//     res.json({
//       success: true,
//       message: "Instagram post created successfully",
//       postId: publishResponse.data.id,
//     });
//     return;
//   } catch (error: any) {
//     console.error(
//       "Error creating Instagram post:",
//       error.response?.data || error.message,
//     );
//     console.log("error is - ", error);
//     res.status(500).json({
//       error: "Failed to create Instagram post",
//       details: error.response?.data,
//     });
//     return;
//   }
// };
// export const createPost = async (req: Request, res: Response) => {
//   const { accessToken, imageUrl, caption } = req.body;

//   if (!accessToken || !imageUrl || !caption) {
//     res.status(400).json({
//       error:
//         "Missing required fields: accessToken, imageUrl, and caption are required",
//     });
//     return;
//   }

//   console.log("Create post controller hit");
//   console.log("Request body received:", {
//     tokenFirstChars: accessToken.substring(0, 10) + "...", // For security, only log part of the token
//     imageUrl,
//     captionLength: caption.length,
//   });

//   // Step 1: Get Instagram user info
//   try {
//     console.log("Step 1: Getting Instagram user info");
//     const userResponse = await axios.get(
//       `https://graph.instagram.com/v22.0/me`,
//       {
//         params: {
//           access_token: accessToken,
//           fields: "id,username,account_type",
//         },
//       },
//     );

//     console.log("User response received:", {
//       id: userResponse.data.id,
//       username: userResponse.data.username,
//       accountType: userResponse.data.account_type,
//     });

//     const instagramUserId = userResponse.data.id;
//     const accountType = userResponse.data.account_type;

//     if (!instagramUserId) {
//       res.status(400).json({ error: "Instagram user ID not found" });
//       return;
//     }

//     if (accountType !== "BUSINESS" && accountType !== "CREATOR") {
//       res.status(400).json({
//         error:
//           "Instagram account must be Business or Creator type to publish content",
//       });
//       return;
//     }

//     // Step 2: Create a container (media object)
//     try {
//       console.log(
//         `Step 2: Creating media container for user ${instagramUserId}`,
//       );
//       const mediaResponse = await axios.post(
//         `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
//         null,
//         {
//           params: {
//             image_url: imageUrl,
//             caption: caption,
//             access_token: accessToken,
//           },
//         },
//       );

//       console.log("Media container created:", mediaResponse.data);
//       const containerId = mediaResponse.data.id;

//       if (!containerId) {
//         res.status(400).json({
//           error: "Failed to create media container",
//           details: mediaResponse.data,
//         });
//         return;
//       }

//       // Step 3: Check container status before publishing
//       try {
//         console.log(`Step 3: Checking status of container ${containerId}`);
//         let containerStatus;
//         let statusCheckAttempts = 0;
//         const maxStatusCheckAttempts = 10;

//         do {
//           const statusResponse = await axios.get(
//             `https://graph.instagram.com/v22.0/${containerId}`,
//             {
//               params: {
//                 fields: "status_code",
//                 access_token: accessToken,
//               },
//             },
//           );

//           containerStatus = statusResponse.data.status_code;
//           console.log(
//             `Container status (attempt ${statusCheckAttempts + 1}):`,
//             containerStatus,
//           );

//           if (containerStatus === "FINISHED") {
//             break;
//           } else if (containerStatus === "ERROR") {
//             res.status(400).json({
//               error: "Error creating media container",
//               details: statusResponse.data,
//             });
//             return;
//           }

//           statusCheckAttempts++;
//           // Wait for 2 seconds before checking again
//           await new Promise((resolve) => setTimeout(resolve, 2000));
//         } while (statusCheckAttempts < maxStatusCheckAttempts);

//         if (containerStatus !== "FINISHED") {
//           res.status(400).json({
//             error: "Media container processing timed out",
//             status: containerStatus,
//           });
//           return;
//         }

//         // Step 4: Publish the container
//         try {
//           console.log(`Step 4: Publishing container ${containerId}`);
//           const publishResponse = await axios.post(
//             `https://graph.instagram.com/v22.0/${instagramUserId}/media_publish`,
//             null,
//             {
//               params: {
//                 creation_id: containerId,
//                 access_token: accessToken,
//               },
//             },
//           );

//           console.log("Post published successfully:", publishResponse.data);

//           // Step 5: Return success response with the Instagram post ID
//           res.json({
//             success: true,
//             message: "Instagram post created successfully",
//             postId: publishResponse.data.id,
//           });
//           return;
//         } catch (publishError: any) {
//           console.error("Error in publishing step:", publishError.message);
//           console.error("Publish error details:", publishError.response?.data);
//           res.status(500).json({
//             error: "Failed to publish Instagram post",
//             details: publishError.response?.data || publishError.message,
//           });
//           return;
//         }
//       } catch (statusError: any) {
//         console.error("Error in status check step:", statusError.message);
//         console.error("Status error details:", statusError.response?.data);
//         res.status(500).json({
//           error: "Failed to check media container status",
//           details: statusError.response?.data || statusError.message,
//         });
//         return;
//       }
//     } catch (mediaError: any) {
//       console.error("Error in media creation step:", mediaError.message);
//       console.error("Media error details:", mediaError.response?.data);
//       res.status(500).json({
//         error: "Failed to create media container",
//         details: mediaError.response?.data || mediaError.message,
//       });
//       return;
//     }
//   } catch (userError: any) {
//     console.error("Error in user info step:", userError.message);
//     if (userError.response) {
//       console.error("User info error status:", userError.response.status);
//       console.error("User info error details:", userError.response.data);
//     } else {
//       console.error("No response received from API");
//     }
//     res.status(500).json({
//       error: "Failed to get Instagram user information",
//       details: userError.response?.data || userError.message,
//     });
//     return;
//   }
// };

export const createPost = async (req: Request, res: Response) => {
  const { accessToken, imageUrl, caption } = req.body;

  if (!accessToken || !imageUrl || !caption) {
    res.status(400).json({
      error:
        "Missing required fields: accessToken, imageUrl, and caption are required",
    });
    return;
  }

  console.log("Create post controller hit");

  try {
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

    console.log("User response:", userResponse.data);
    const instagramUserId = userResponse.data.id;
    const accountType = userResponse.data.account_type;

    if (!instagramUserId) {
      res.status(400).json({ error: "Instagram user ID not found" });
      return;
    }

    if (accountType !== "BUSINESS" && accountType !== "CREATOR") {
      res.status(400).json({
        error:
          "Instagram account must be Business or Creator type to publish content",
      });
      return;
    }

    // Step 2: Create a container (media object)
    const mediaResponse = await axios.post(
      `https://graph.instagram.com/v22.0/${instagramUserId}/media`,
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
      `https://graph.instagram.com/v22.0/${instagramUserId}/media_publish`,
      null,
      {
        params: {
          creation_id: containerId,
          access_token: accessToken,
        },
      },
    );

    console.log("Publish response:", publishResponse.data);

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
};
