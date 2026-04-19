import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UseMutationResult } from '@tanstack/react-query';
import { API_ENDPOINTS } from '@/lib/server';
import { authTokens } from '@/lib/auth';
import type { LoginRequest, LoginResponse, User, UpdateProfileRequest, ChangePasswordRequest } from '@/lib/auth';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

// Login Mutation Hook
export function useLogin(): UseMutationResult<LoginResponse, Error, LoginRequest> {
  return useMutation({
    mutationFn: async (credentials: LoginRequest): Promise<LoginResponse> => {
      const response = await api.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Store tokens securely in cookies
      authTokens.setTokens(data.access, data.refresh);
      
      // Update global auth state to allow navigation through ProtectedRoute
      useAuthStore.getState().setAuthenticated(true);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

// Logout Hook
export function useLogout() {
  const { logout: clearAuthState } = useAuthStore();
  const queryClient = useQueryClient();
  
  return () => {
    // Clear cookies
    authTokens.clearTokens();
    
    // Clear Zustand state
    clearAuthState();
    
    // Clear React Query Cache
    queryClient.clear(); // Wipes all cached data (user, customers, etc)

    // Redirect to login
    window.location.href = '/login';
  };
}

// Check if authenticated (has valid token)
export function useIsAuthenticated(): boolean {
  return authTokens.hasTokens();
}

// Get Current User Profile
export function useUser() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async (): Promise<User> => {
      const response = await api.get(API_ENDPOINTS.AUTH.USER_PROFILE);
      return response.data;
    },
    enabled: authTokens.hasTokens(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Update User Profile
export function useUpdateProfile(): UseMutationResult<User, Error, UpdateProfileRequest> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateProfileRequest): Promise<User> => {
        const response = await api.put(API_ENDPOINTS.AUTH.USER_PROFILE, data);
        return response.data;
    },
    onSuccess: (data) => {
        queryClient.setQueryData(['user', 'me'], data);
    },
  });
}

// Change Password
export function useChangePassword(): UseMutationResult<void, Error, ChangePasswordRequest> {
  return useMutation({
    mutationFn: async (data: ChangePasswordRequest): Promise<void> => {
        await api.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data);
    },
  });
}

// Verify Token
export function useVerifyToken(): UseMutationResult<void, Error, { token: string }> {
    return useMutation({
        mutationFn: async ({ token }): Promise<void> => {
            await api.post(API_ENDPOINTS.AUTH.VERIFY, { token });
        }
    });
}
