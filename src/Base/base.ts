// Get base URL from environment variables (Vite uses import.meta.env)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BASE_URL || 'http://localhost:4000';

export const BASE_URL = BACKEND_URL;
export const API_BASE_URL = `${BACKEND_URL}/api`;
