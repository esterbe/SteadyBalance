/**
 * Calculate how to allocate a deposit across assets to rebalance toward targets.
 *
 * @param {number[]} currentValues - Current ILS value per asset (same order as assets)
 * @param {number} deposit - Amount to allocate in ILS
 * @param {Array<{id: string, name: string, target: number}>} assets - Asset definitions
 * @returns {Array<{id: string, name: string, currentPct: number, targetPct: number, buy: number, afterPct: number, deviation: number}>}
 */
export function calculateAllocation(currentValues, deposit, assets) {
  const totalAfter = currentValues.reduce((s, v) => s + v, 0) + deposit;

  if (totalAfter === 0) {
    return assets.map((a) => ({
      id: a.id,
      name: a.name,
      currentPct: 0,
      targetPct: a.target,
      buy: 0,
      afterPct: 0,
      deviation: -a.target,
    }));
  }

  const targetPcts = assets.map((a) => a.target / 100);
  const currentPcts = currentValues.map((v) => v / totalAfter);

  // Tolerance: 1 percentage point
  const TOLERANCE = 0.01;

  // Phase 1: allocate to assets that are below target (beyond tolerance)
  const deficitPcts = targetPcts.map((t, i) => {
    const gap = t - currentPcts[i];
    return gap > TOLERANCE ? gap : 0;
  });
  const deficitValues = deficitPcts.map((d) => d * totalAfter);
  const totalDeficit = deficitValues.reduce((s, v) => s + v, 0);

  const buys = new Array(assets.length).fill(0);
  let remaining = deposit;

  if (totalDeficit > 0 && remaining > 0) {
    const deficitAlloc = Math.min(remaining, totalDeficit);
    for (let i = 0; i < assets.length; i++) {
      buys[i] = (deficitValues[i] / totalDeficit) * deficitAlloc;
    }
    remaining -= deficitAlloc;
  }

  // Phase 2: distribute remainder by target weights
  if (remaining > 0) {
    const totalTargetPct = targetPcts.reduce((s, v) => s + v, 0);
    for (let i = 0; i < assets.length; i++) {
      buys[i] += (targetPcts[i] / totalTargetPct) * remaining;
    }
  }

  // Round to whole ILS, ensuring sum === deposit exactly
  const roundedBuys = buys.map((b) => Math.round(b));
  let roundingError = deposit - roundedBuys.reduce((s, v) => s + v, 0);

  // Fix rounding error by adjusting the asset with largest fractional remainder
  if (roundingError !== 0) {
    const fractionals = buys.map((b, i) => ({
      i,
      frac: b - Math.floor(b),
    }));
    // Sort descending by fractional part
    fractionals.sort((a, b) => b.frac - a.frac);

    let idx = 0;
    while (roundingError > 0 && idx < fractionals.length) {
      roundedBuys[fractionals[idx].i] += 1;
      roundingError -= 1;
      idx++;
    }
    idx = fractionals.length - 1;
    while (roundingError < 0 && idx >= 0) {
      roundedBuys[fractionals[idx].i] -= 1;
      roundingError += 1;
      idx--;
    }
  }

  return assets.map((a, i) => {
    const afterValue = currentValues[i] + roundedBuys[i];
    const afterPct = (afterValue / totalAfter) * 100;
    const currentPct = (currentValues[i] / totalAfter) * 100;
    return {
      id: a.id,
      name: a.name,
      currentPct: Math.round(currentPct * 10) / 10,
      targetPct: a.target,
      buy: roundedBuys[i],
      afterPct: Math.round(afterPct * 10) / 10,
      deviation: Math.round((afterPct - a.target) * 10) / 10,
    };
  });
}
