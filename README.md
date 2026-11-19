# CLG-Connect

Anonymous Campus Community

## Deploy on Render

This repository includes a `render.yaml` Blueprint. In Render, choose **New +** → **Blueprint**, connect this repository, and deploy the `main` branch. The Blueprint creates the Node web service and PostgreSQL database. The existing `backend/` and `frontend/` folders stay in place; the backend serves the frontend and applies `backend/database/schema.sql` when it starts.

The Blueprint uses Render's free plans. Free PostgreSQL databases expire after 30 days, so use a paid database plan if you need the deployed data to persist beyond that period.
