# CLG-Connect

Anonymous Campus Community

## Deploy on Render

This repository includes a `render.yaml` Blueprint. In Render, choose **New +** → **Blueprint**, connect this repository, and deploy the `main` branch. The Blueprint creates the Node web service and PostgreSQL database. The existing `backend/` and `frontend/` folders stay in place; the backend serves the frontend and applies `backend/database/schema.sql` when it starts.

The Blueprint uses Render's free plans. Free PostgreSQL databases expire after 30 days, so use a paid database plan if you need the deployed data to persist beyond that period.

## Communities

Communities, memberships, roles, posts, and chat messages are stored in PostgreSQL. The first signed-in user initializes the starter communities and is their leader. Community creators are leaders; leaders can promote members to admin, remove members, and delete posts from their community. Members can post and chat. Chat refreshes automatically while its tab is open.

The backend applies the community role and chat table migrations from `backend/database/schema.sql` when it starts.

## Password reset email setup

Password reset sends a one-time code through the Gmail API over HTTPS. Render's free web services block SMTP ports, so a Gmail App Password used with SMTP will not work.

1. In Google Cloud, create a project and enable the Gmail API.
2. Configure the OAuth consent screen and add the Gmail account that will send reset emails as a test user.
3. Create a **Web application** OAuth client and add `https://developers.google.com/oauthplayground` as an authorized redirect URI.
4. In [OAuth 2.0 Playground](https://developers.google.com/oauthplayground), open Settings, enable **Use your own OAuth credentials**, and enter the OAuth client ID and secret. Authorize `https://www.googleapis.com/auth/gmail.send`, exchange the code, and copy the refresh token.
5. In the Render web service's Environment settings, add `GMAIL_USER`, `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REFRESH_TOKEN`. Keep these values private. `JWT_SECRET` is already required by the app and is used to hash reset codes.

Reset codes expire after 10 minutes, can be used once, and allow at most five attempts. OAuth consent screens left in Testing issue refresh tokens that expire after seven days; longer-term public use may require publishing and Google's verification for the Gmail send scope.
