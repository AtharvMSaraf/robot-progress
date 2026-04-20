import { create } from 'zustand';
import * as repo from '../lib/repository.js';

export const useEntries = create((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  lastLoadedAt: null,

  async refresh() {
    set({ loading: true, error: null });
    try {
      const entries = await repo.listEntries();
      set({ entries, loading: false, lastLoadedAt: new Date().toISOString() });
    } catch (err) {
      set({ loading: false, error: err.message || String(err) });
    }
  },

  async saveBatch(entries, rawReport) {
    const inserted = await repo.saveBatch(entries, rawReport);
    await get().refresh();
    return inserted;
  },

  async deleteEntry(id) {
    await repo.deleteEntry(id);
    await get().refresh();
  },
}));
