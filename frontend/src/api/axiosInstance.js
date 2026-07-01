import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor for JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('aayu_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/users/login') || error.config?.url?.includes('/users/otp/login');
    if (error.response && error.response.status === 401 && !isLoginRequest) {
      localStorage.removeItem('aayu_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
