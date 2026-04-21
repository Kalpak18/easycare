/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";

interface SocketState {
  activeJobs: number;
  onlineProviders: number;
  newRequests: any[];

  setActiveJobs: (count: number) => void;
  setOnlineProviders: (count: number) => void;
  addRequest: (request: any) => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  activeJobs: 0,
  onlineProviders: 0,
  newRequests: [],

  setActiveJobs: (count) => set({ activeJobs: count }),

  setOnlineProviders: (count) => set({ onlineProviders: count }),

  addRequest: (request) =>
    set((state) => ({
      newRequests: [request, ...state.newRequests],
    })),
}));