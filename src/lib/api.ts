// api.js
import { API_BASE_URL } from '@/Base/base';
import axios from 'axios';
import { getAccessToken, setAccessToken } from '@/contexts/tokenStore'; // a simple in-memory store

const API_BASE_URI = API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URI,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // enable sending httpOnly cookies
});

// Request interceptor to attach access token from memory
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent multiple simultaneous refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const response = await axios.post(
            `${API_BASE_URI}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const newToken = response.data.data.accessToken;
          setAccessToken(newToken);
          isRefreshing = false;
          onRefreshed(newToken);
        } catch (refreshError) {
          isRefreshing = false;
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      // Queue requests while refreshing
      return new Promise((resolve) => {
        addRefreshSubscriber((token) => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          resolve(axios(originalRequest));
        });
      });
    }

    // Redirect to login for other 401 cases
    if (error.response?.status === 401) {
      const isAuthEndpoint = originalRequest.url?.includes('/auth/');
      const isLoginPage = window.location.pathname.includes('/login');

      if (!isLoginPage && !isAuthEndpoint) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
