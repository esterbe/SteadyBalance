import { describe, it, expect } from 'vitest';
import { calculateAllocation } from './allocator';

const ASSETS = [
  { id: '1', name: 'US Large Cap', target: 48 },
  { id: '2', name: 'IL Gov Bonds', target: 33 },
  { id: '3', name: 'Europe Equities', target: 12 },
  { id: '4', name: 'Emerging Markets', target: 7 },
];

describe('calculateAllocation', () => {
  it('should allocate most to the most underweight asset', () => {
    // US Large Cap is very underweight
    const holdings = [10000, 33000, 12000, 7000];
    const deposit = 10000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const usLargeCap = results.find((r) => r.id === '1');
    const maxBuy = Math.max(...results.map((r) => r.buy));
    expect(usLargeCap.buy).toBe(maxBuy);
  });

  it('should give no deficit allocation to asset within tolerance', () => {
    // All roughly on target — IL Gov Bonds slightly over
    const holdings = [48000, 34000, 12000, 7000];
    const deposit = 1000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    // All buys should be distributed by target weights (phase 2)
    const totalBuy = results.reduce((s, r) => s + r.buy, 0);
    expect(totalBuy).toBe(1000);
  });

  it('should distribute remainder by target weights', () => {
    // When on target pre-deposit, adding deposit dilutes all equally,
    // so deficit allocation restores them, then remainder goes by target weights.
    const holdings = [48000, 33000, 12000, 7000];
    const deposit = 10000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const totalBuy = results.reduce((s, r) => s + r.buy, 0);
    expect(totalBuy).toBe(10000);

    // US Large Cap (48% target) should get the largest allocation
    const usLargeCap = results.find((r) => r.id === '1');
    const maxBuy = Math.max(...results.map((r) => r.buy));
    expect(usLargeCap.buy).toBe(maxBuy);
  });

  it('should round buys to whole ILS and sum exactly to deposit', () => {
    const holdings = [100000, 70000, 25000, 15000];
    const deposit = 13000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const totalBuy = results.reduce((s, r) => s + r.buy, 0);
    expect(totalBuy).toBe(13000);
    results.forEach((r) => {
      expect(r.buy).toBe(Math.round(r.buy));
    });
  });

  it('should produce no buys when deposit is zero', () => {
    const holdings = [48000, 33000, 12000, 7000];
    const results = calculateAllocation(holdings, 0, ASSETS);

    results.forEach((r) => {
      expect(r.buy).toBe(0);
    });
  });

  it('should distribute by target weights when all assets are on target', () => {
    const holdings = [4800, 3300, 1200, 700];
    const deposit = 1000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const totalBuy = results.reduce((s, r) => s + r.buy, 0);
    expect(totalBuy).toBe(1000);

    // Largest target should get largest buy
    const usLargeCap = results.find((r) => r.id === '1');
    const maxBuy = Math.max(...results.map((r) => r.buy));
    expect(usLargeCap.buy).toBe(maxBuy);
  });

  it('should handle single asset way underweight', () => {
    // Emerging Markets is 0 — way underweight
    const holdings = [50000, 35000, 15000, 0];
    const deposit = 10000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const em = results.find((r) => r.id === '4');
    expect(em.buy).toBeGreaterThan(0);
    expect(em.afterPct).toBeGreaterThan(0);
  });

  it('should handle all zeros with deposit', () => {
    const holdings = [0, 0, 0, 0];
    const deposit = 10000;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    const totalBuy = results.reduce((s, r) => s + r.buy, 0);
    expect(totalBuy).toBe(10000);

    // Should distribute roughly by target weights (deficit + remainder phases)
    const usLargeCap = results.find((r) => r.id === '1');
    const maxBuy = Math.max(...results.map((r) => r.buy));
    expect(usLargeCap.buy).toBe(maxBuy);
    expect(usLargeCap.buy).toBeGreaterThan(4000);
  });

  it('should handle all zeros with zero deposit', () => {
    const holdings = [0, 0, 0, 0];
    const results = calculateAllocation(holdings, 0, ASSETS);

    results.forEach((r) => {
      expect(r.buy).toBe(0);
      expect(r.currentPct).toBe(0);
      expect(r.afterPct).toBe(0);
    });
  });

  it('should return correct deviation values', () => {
    const holdings = [48000, 33000, 12000, 7000];
    const deposit = 0;
    const results = calculateAllocation(holdings, deposit, ASSETS);

    results.forEach((r) => {
      expect(r.deviation).toBe(Math.round((r.afterPct - r.targetPct) * 10) / 10);
    });
  });
});
