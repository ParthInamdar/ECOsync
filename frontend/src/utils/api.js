import axios from 'axios';

const isProd = import.meta.env.PROD;
let baseURL = import.meta.env.VITE_API_BASE_URL;

if (!baseURL) {
  if (isProd) {
    console.error("CRITICAL ERROR: VITE_API_BASE_URL is not configured for production environment.");
    // Do NOT fallback to localhost in production
    baseURL = 'https://api.your-production-domain.com/api'; 
  } else {
    baseURL = 'http://localhost:5000/api';
  }
}

const api = axios.create({
  baseURL,
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
