// Backend API origin.
// In development this defaults to the local backend server.
// For production builds set VITE_API_URL (e.g. in .env.production or your CI)
// to your deployed backend URL, e.g. https://figtyp-api.example.com
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
