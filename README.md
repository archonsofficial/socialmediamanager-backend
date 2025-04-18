# socialmediamanager-backend

## Instagram Routes

### 1. Initiate Instagram OAuth
**GET** `/instagram/auth`

Redirects the user to Instagram's OAuth page.

### 2. Handle OAuth Callback
**GET** `/instagram/auth/callback`

Handles the OAuth response and exchanges the authorization code for an access token.

### 3. Create Instagram Post
**POST** `/instagram/create-post`

**Body**:
```json
{
  "accessToken": "user_access_token",
  "imageUrl": "https://example.com/image.jpg",
  "caption": "Your post caption"
}
```

Creates a post on the user's Instagram account.