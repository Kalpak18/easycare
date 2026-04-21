import { create } from 'zustand';
import { ProviderService } from '../services/provider.service';

type Job = {
  id: string;
  status: string;
  totalAmount: number;
  paymentMode: string;
  category?: { name: string };
  user?: { name: string; phone: string };
};

type DashboardData = {
  profile: {
    id?: string;
    name: string;
    isOnline: boolean;
    rating: number;
    category: { name: string };
  };
  wallet: {
    balance: number;
    blocked: boolean;
  };
  activeJobs: Job[];
  todayEarnings: number;
};

type ProviderState = {
  dashboard: DashboardData | null;
  loading: boolean;
  error: string | null;

  fetchDashboard: (silent?: boolean) => Promise<void>;
  toggleOnline: () => Promise<void>;
  reset: () => void;
};

// Deduplicate concurrent fetchDashboard calls — only one in-flight at a time
let _fetchInflight: Promise<void> | null = null;

export const useProviderStore = create<ProviderState>((set, get) => ({
  dashboard: null,
  loading: false,
  error: null,

  async fetchDashboard(silent = false) {
    if (_fetchInflight) return _fetchInflight;

    _fetchInflight = (async () => {
      try {
        if (!silent) set({ loading: true, error: null });
        const data = await ProviderService.getDashboard();

        // Guard: if a toggle started while this fetch was in-flight, preserve the
        // optimistic isOnline value so the fetch result doesn't snap it back.
        set({ dashboard: data, loading: false });
      } catch {
        set({ error: 'Failed to load dashboard', loading: false });
      } finally {
        _fetchInflight = null;
      }
    })();

    return _fetchInflight;
  },

  reset() {
    _fetchInflight = null;
    set({ dashboard: null, loading: false, error: null });
  },

  async toggleOnline() {
    const dashboard = get().dashboard;
    if (!dashboard) return;

    const wasOnline = dashboard.profile.isOnline;

    // Flip UI immediately — don't wait for the API call
    set({
      error: null,
      dashboard: {
        ...dashboard,
        profile: { ...dashboard.profile, isOnline: !wasOnline },
      },
    });

    // Fire API in background — if it fails revert the optimistic flip
    try {
      if (wasOnline) {
        await ProviderService.goOffline();
      } else {
        await ProviderService.goOnline();
      }
      // Sync real server state silently after a successful toggle
      get().fetchDashboard(true);
    } catch (e: any) {
      const current = get().dashboard;
      set({
        dashboard: current
          ? { ...current, profile: { ...current.profile, isOnline: wasOnline } }
          : dashboard,
        error:
          e?.response?.data?.message ??
          e?.response?.data?.code ??
          'Unable to update online status',
      });
    }
  },
}));
