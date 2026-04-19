import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_ENDPOINTS } from './server';
import { authTokens, type RefreshResponse } from './auth';
import { useAuthStore } from '@/store/useAuthStore';

// Create Axios Instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout (increased for robustness)
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor - Add Auth Token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authTokens.getAccessToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Handle 401 and Refresh Token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Skip refresh logic for auth endpoints (login, refresh, verify)
    // These should return errors directly to the caller
    const authPaths = [API_ENDPOINTS.AUTH.LOGIN, API_ENDPOINTS.AUTH.REFRESH, API_ENDPOINTS.AUTH.VERIFY];
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest = authPaths.some((path) => requestUrl.includes(path));
    
    if (isAuthRequest) {
      return Promise.reject(error);
    }
    
    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = authTokens.getRefreshToken();
      
      if (!refreshToken) {
        // No refresh token, clear local state and redirect to login
        authTokens.clearTokens();
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Call refresh endpoint
        const response = await axios.post<RefreshResponse>(
          `${API_BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`,
          { refresh: refreshToken }
        );
        
        const newAccessToken = response.data.access;
        
        // Update tokens
        authTokens.setTokens(newAccessToken, refreshToken);
        
        processQueue(null, newAccessToken);
        
        // Retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        // If refresh truly fails, clear EVERYTHING
        authTokens.clearTokens();
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
