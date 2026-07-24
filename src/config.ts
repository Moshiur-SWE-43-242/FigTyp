// Backend API origin.
// In production (Monolithic setup on Render), the frontend and backend share the same URL, so it becomes an empty string.
// In local development, it automatically points to your local backend server (port 5000).

export const API_URL = import.meta.env.MODE === 'production' 
  ? '' 
  : 'http://localhost:5000';