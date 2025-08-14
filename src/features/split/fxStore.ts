import { create } from 'zustand';
import type { FXRate } from '../../lib/fx';

interface FXStore {
  fxRate: FXRate | null;
  setFXRate: (rate: FXRate) => void;
  clearFXRate: () => void;
}

export const useFXStore = create<FXStore>((set) => ({
  fxRate: null,
  setFXRate: (rate: FXRate) => set({ fxRate: rate }),
  clearFXRate: () => set({ fxRate: null })
}));