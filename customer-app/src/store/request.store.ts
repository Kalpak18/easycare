import { create } from 'zustand';
import { ServiceRequest } from '../types';
import { getMyRequests } from '../services/request.service';

const ACTIVE_STATUSES = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'];

interface RequestState {
  activeRequests: ServiceRequest[];
  pastRequests: ServiceRequest[];
  loading: boolean;
  setActiveRequests: (requests: ServiceRequest[]) => void;
  setPastRequests: (requests: ServiceRequest[]) => void;
  fetchRequests: () => Promise<void>;
  updateRequest: (updated: ServiceRequest) => void;
}

export const useRequestStore = create<RequestState>((set, get) => ({
  activeRequests: [],
  pastRequests: [],
  loading: false,

  setActiveRequests: (requests) => set({ activeRequests: requests }),
  setPastRequests: (requests) => set({ pastRequests: requests }),

  async fetchRequests() {
    try {
      set({ loading: true });
      const all = await getMyRequests();
      set({
        activeRequests: all.filter((r) => ACTIVE_STATUSES.includes(r.status)),
        pastRequests: all.filter((r) => !ACTIVE_STATUSES.includes(r.status)),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  updateRequest: (updated) => {
    const { activeRequests, pastRequests } = get();
    const isTerminal = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'DISPUTED'].includes(updated.status);

    if (isTerminal) {
      const existing = activeRequests.find((r) => r.id === updated.id);
      const merged = existing ? { ...existing, ...updated } : updated;
      set({
        activeRequests: activeRequests.filter((r) => r.id !== updated.id),
        pastRequests: [merged, ...pastRequests.filter((r) => r.id !== updated.id)],
      });
    } else {
      const exists = activeRequests.some((r) => r.id === updated.id);
      set({
        activeRequests: exists
          ? activeRequests.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          : [updated, ...activeRequests],
      });
    }
  },
}));
