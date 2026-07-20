# FigTyp Backend

This folder contains the Express backend API for FigTyp.

## Run the backend

1. Install dependencies:
   `npm install`
2. Start the backend server in development mode:
   `npm run dev`

## API endpoints

- `GET /` - health check
- `POST /api/auth/...` - authentication routes
- `POST /api/contests/...` - contest management
- `POST /api/certificates/...` - certificate routes
- `POST /api/attempts/...` - attempt tracking
- `POST /api/activity-logs/...` - activity logging
- `POST /api/settings/...` - settings management

## Notes

- The backend uses `dotenv` for configuration.
- `FRONTEND_URL` can be set to restrict socket origin access.
- Default runtime port is `5000`.
