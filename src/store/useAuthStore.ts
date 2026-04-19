import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type User, authTokens } from "@/lib/auth";

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: User | null;
  login: (phone: string) => void;
  logout: () => void;
  setAuthenticated: (value: boolean) => void;
  setInitializing: (value: boolean) => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      isInitializing: true,
      user: null,
      login: (phone: string) => {
        // Mock Login Logic
        const mockUser: User = {
          id: 1,
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          email: "admin@example.com",
          phone_number: phone, 
          role: "admin",
          avatar: "https://github.com/shadcn.png",
          is_active: true,
          permission_groups: [],
        };
        set({ isAuthenticated: true, user: mockUser });
      },
      logout: () => {
        authTokens.clearTokens();
        set({ isAuthenticated: false, isInitializing: false, user: null });
      },
      setAuthenticated: (value) => set({ isAuthenticated: value, isInitializing: false }),
      setInitializing: (value) => set({ isInitializing: value }),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: "auth-storage",
      // Default storage is localStorage, which is what we want for persistence
    }
  )
);
