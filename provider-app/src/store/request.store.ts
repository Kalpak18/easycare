import { create } from "zustand";

type RequestState = {
  request: any | null;
  setRequest: (req: any) => void;
  clearRequest: () => void;
};

export const useRequestStore = create<RequestState>((set) => ({
  request: null,
  setRequest: (req) => set({ request: req }),
  clearRequest: () => set({ request: null }),
}));