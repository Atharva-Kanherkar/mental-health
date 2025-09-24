import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.my-echoes.app';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important: Send cookies with requests
});

// Set Content-Type only for requests that aren't FormData
api.interceptors.request.use((config) => {
  // Don't set Content-Type for FormData - let axios handle it automatically
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
