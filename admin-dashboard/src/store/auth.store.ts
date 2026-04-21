import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,

  setToken: (token) => {
    localStorage.setItem("admin_token", token);
    set({ token });
  },

  logout: () => {
  localStorage.removeItem("admin_token")

  document.cookie =
    "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

  set({ token: null })
},
}));