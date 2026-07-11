import { describe, it, expect } from 'vitest';
import { ALPHA_MAX, buildSteps, SHADE_MAX } from '~/lib/generate/steps';
import { MAX_GENERATED } from '~/lib/generate/types';

const steps = (from: number, to: number, step: number, max = SHADE_MAX): number[] => {
  const result = buildSteps(from, to, step, max);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const errorOf = (from: number, to: number, step: number, max = SHADE_MAX): string => {
  const result = buildSteps(from, to, step, max);
  if (result.ok) throw new Error(`expected an error, got [${result.value.join(', ')}]`);
  return result.error;
};

describe('buildSteps', () => {
  it('starts at the boundary and continues on multiples of the step', () => {
    expect(steps(50, 800, 100)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800]);
    expect(steps(50, 800, 50)).toEqual([
      50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800,
    ]);
  });

  it('sorts ascending regardless of the direction typed', () => {
    expect(steps(800, 50, 100)).toEqual(steps(50, 800, 100));
    expect(steps(950, 100, 200)).toEqual([100, 200, 400, 600, 800, 950]);
  });

  it('keeps both typed boundaries even when they are not multiples', () => {
    expect(steps(50, 850, 100)).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 850]);
    expect(steps(30, 90, 25)).toEqual([30, 50, 75, 90]);
  });

  it('never duplicates a boundary that is already a multiple', () => {
    expect(steps(100, 400, 100)).toEqual([100, 200, 300, 400]);
    expect(steps(0, 300, 100)).toEqual([0, 100, 200, 300]);
  });

  it('handles a range narrower than one step', () => {
    expect(steps(510, 520, 100)).toEqual([510, 520]);
  });

  it('serves the alpha ramp domain', () => {
    expect(steps(10, 100, 10, ALPHA_MAX)).toEqual([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    expect(errorOf(0, 500, 100, ALPHA_MAX)).toMatch(/не должны превышать 100/);
  });

  it('rejects boundaries above the domain maximum', () => {
    expect(errorOf(50, 5000, 1000)).toMatch(/не должны превышать 1000/);
    expect(steps(0, SHADE_MAX, 500)).toEqual([0, 500, 1000]);
  });

  it('rejects a non-positive or fractional step', () => {
    expect(errorOf(50, 800, 0)).toMatch(/Шаг/);
    expect(errorOf(50, 800, -100)).toMatch(/Шаг/);
    expect(errorOf(50, 800, 12.5)).toMatch(/Шаг/);
  });

  it('rejects a degenerate range', () => {
    expect(errorOf(500, 500, 100)).toMatch(/совпадают/);
  });

  it('rejects non-integer, negative and non-finite boundaries', () => {
    expect(errorOf(50.5, 800, 100)).toMatch(/целыми/);
    expect(errorOf(-50, 800, 100)).toMatch(/целыми/);
    expect(errorOf(Number.NaN, 800, 100)).toMatch(/целыми/);
    expect(errorOf(50, Number.POSITIVE_INFINITY, 100)).toMatch(/целыми/);
  });

  it('rejects unsafe integers instead of looping forever', () => {
    expect(errorOf(1e17, 1e17 + 32, 1, Number.MAX_SAFE_INTEGER)).toMatch(/целыми/);
    expect(errorOf(0, 10, 1e17, SHADE_MAX)).toMatch(/Шаг/);
  });

  it('refuses to build more than the colour limit', () => {
    expect(steps(0, MAX_GENERATED - 1, 1)).toHaveLength(MAX_GENERATED);
    expect(errorOf(0, MAX_GENERATED, 1)).toMatch(/Слишком много/);
    expect(errorOf(0, 1_000_000_000, 1, Number.MAX_SAFE_INTEGER)).toMatch(/Слишком много/);
  });
});
