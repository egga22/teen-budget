import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadProfiles, saveProfiles } from './storage';
import type { Profile } from './types';

describe('storage', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('saves and loads profiles', () => {
    const data: Profile[] = [{
      id: '1',
      name: 'Test',
      balance: 0,
      categories: [],
      transactions: [],
      goals: [],
      budgets: {},
    }];
    saveProfiles(data);
    const loaded = loadProfiles();
    expect(loaded.length).toBe(1);
    expect(loaded[0].name).toBe('Test');
  });
});
