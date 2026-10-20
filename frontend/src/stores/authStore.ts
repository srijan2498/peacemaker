import { create } from 'zustand';
import { api } from '../services/api';
import type { UserSummary, FamilySummary } from 'cozynest-shared';

interface FamilyWithRole extends FamilySummary {
  role: 'admin' | 'member';
  membershipId: string;
}

interface AuthState {
  user: UserSummary | null;
  families: FamilyWithRole[];
  activeFamily: FamilyWithRole | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  childMode: boolean;

  setAuth: (user: UserSummary, token?: string) => void;
  setActiveFamily: (family: FamilyWithRole | null) => void;
  setChildMode: (enabled: boolean) => void;
  fetchMe: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  families: [],
  activeFamily: null,
  token: localStorage.getItem('cozynest_token'),
  isLoading: !!localStorage.getItem('cozynest_token'),
  isAuthenticated: !!localStorage.getItem('cozynest_token'),
  childMode: false,

  setAuth: (user, token) => {
    if (token) {
      localStorage.setItem('cozynest_token', token);
    }
    set({
      user,
      token: token || get().token,
      isAuthenticated: true,
      isLoading: false,
      childMode: user?.childMode || false
    });
  },

  setActiveFamily: family => {
    if (family) {
      localStorage.setItem('cozynest_active_family_id', family._id);
    } else {
      localStorage.removeItem('cozynest_active_family_id');
    }
    set({ activeFamily: family });
  },

  setChildMode: enabled => {
    set({ childMode: enabled });
    if (get().user) {
      api.patch('/auth/profile', { childMode: enabled }).catch(() => {});
    }
  },

  fetchMe: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await api.get('/auth/me');
      const { user, families } = res.data.data;

      const mappedFamilies: FamilyWithRole[] = (families || []).map((f: any) => ({
        ...f.family,
        role: f.role,
        membershipId: f.membershipId
      }));

      // Find previously saved active family or default to first
      const savedFamId = localStorage.getItem('cozynest_active_family_id');
      const active =
        mappedFamilies.find(fam => fam._id === savedFamId) || mappedFamilies[0] || null;

      set({
        user,
        families: mappedFamilies,
        activeFamily: active,
        isAuthenticated: true,
        childMode: user?.childMode || false,
        isLoading: false
      });
    } catch (err) {
      localStorage.removeItem('cozynest_token');
      set({
        user: null,
        families: [],
        activeFamily: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    localStorage.removeItem('cozynest_token');
    localStorage.removeItem('cozynest_active_family_id');
    set({
      user: null,
      families: [],
      activeFamily: null,
      token: null,
      isAuthenticated: false
    });
  }
}));
