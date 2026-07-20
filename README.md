# FigTyp

FigTyp is a local typing practice platform with training exercises, real-time contests, certificates, and progress tracking.

## Workspace Structure

- `src/` - frontend application source
- `public/` - frontend static assets
- `backend/` - Express backend API and server code
- `firebase.json` - Firebase hosting config for the frontend

## Run Locally

1. Install frontend dependencies:
   `npm install`
2. Install backend dependencies:
   `cd backend && npm install`
3. Start the backend server:
   `cd backend && npm run dev`
4. Start the frontend app:
   `npm run dev`
5. Open the app in your browser at:
   `http://localhost:3000`

## Build for Production

1. Build the frontend application:
   `npm run build`
2. Deploy the generated `dist/` directory to your hosting provider.
