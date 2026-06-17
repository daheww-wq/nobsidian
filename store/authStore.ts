import { create } from 'zustand';

interface AuthUser {
  login: string;
  name: string | null;
  avatarUrl: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  fetchSession: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  fetchSession: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/auth/session');
      if (res.ok) {
        const data = (await res.json()) as { authenticated: boolean; user: AuthUser };
        set({ user: data.authenticated ? data.user : null });
      } else {
        set({ user: null });
      }
    } catch {
      set({ user: null });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null });
  },
}));
