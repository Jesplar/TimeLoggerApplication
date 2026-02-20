import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  lastUsedCustomerId: number | null;
  lastUsedProjectId: number | null;
  lastUsedTimeCodeId: number | null;
  setLastUsedCustomer: (id: number) => void;
  setLastUsedProject: (id: number) => void;
  setLastUsedTimeCode: (id: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      lastUsedCustomerId: null,
      lastUsedProjectId: null,
      lastUsedTimeCodeId: null,
      setLastUsedCustomer: (id) => set({ lastUsedCustomerId: id }),
      setLastUsedProject: (id) => set({ lastUsedProjectId: id }),
      setLastUsedTimeCode: (id) => set({ lastUsedTimeCodeId: id }),
    }),
    {
      name: 'timelogger-storage',
    }
  )
);
