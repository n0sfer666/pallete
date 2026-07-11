import { describe, it, expect } from 'vitest';
import { generateShade, type ShadeParams } from '~/lib/generate/shade';
import { hexToOklch } from '~/lib/color/oklch';
import type { GeneratedColor } from '~/lib/generate/types';

const PARAMS: ShadeParams = { from: 50, to: 900, step: 100, baseShade: 500 };
const BASE = '#3B82F6';

const colorsOf = (baseHex: string, params: ShadeParams): GeneratedColor[] => {
  const result = generateShade(baseHex, params);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const errorOf = (baseHex: string, params: ShadeParams): string => {
  const result = generateShade(baseHex, params);
  if (result.ok) throw new Error(`expected an error, got ${result.value.length} colors`);
  return result.error;
};

const lightnessOf = (hex: string): number => {
  const value = hexToOklch(hex);
  if (value === null) throw new Error(`unparsable hex: ${hex}`);
  return value.l;
};

describe('generateShade', () => {
  it('names every colour after its shade number, ascending', () => {
    expect(colorsOf(BASE, PARAMS).map((c) => c.name)).toEqual([
      '50', '100', '200', '300', '400', '500', '600', '700', '800', '900',
    ]);
  });

  it('reproduces the base colour exactly at the base shade', () => {
    const colors = colorsOf(BASE, PARAMS);
    expect(colors.find((c) => c.name === '500')?.hex).toBe(BASE);
  });

  it('darkens as the shade number grows', () => {
    const lightness = colorsOf(BASE, PARAMS).map((c) => lightnessOf(c.hex));
    const descending = [...lightness].sort((a, b) => b - a);
    expect(lightness).toEqual(descending);
    expect(new Set(lightness).size).toBe(lightness.length);
  });

  it('never leaves the [0, 1] lightness range', () => {
    const colors = colorsOf(BASE, { from: 0, to: 1000, step: 100, baseShade: 500 });
    for (const color of colors) {
      const l = lightnessOf(color.hex);
      expect(l).toBeGreaterThanOrEqual(0);
      expect(l).toBeLessThanOrEqual(1);
    }
  });

  it('treats 100 shade units as 10% of the way to white or black', () => {
    const base = lightnessOf(BASE);
    const colors = colorsOf(BASE, PARAMS);
    const lighter = colors.find((c) => c.name === '400');
    const darker = colors.find((c) => c.name === '600');
    expect(lightnessOf(lighter?.hex ?? '')).toBeCloseTo(base + 0.1 * (1 - base), 2);
    expect(lightnessOf(darker?.hex ?? '')).toBeCloseTo(base - 0.1 * base, 2);
  });

  it('is insensitive to the direction the range was typed in', () => {
    const forward = colorsOf(BASE, PARAMS);
    const reversed = colorsOf(BASE, { ...PARAMS, from: 900, to: 50 });
    expect(reversed).toEqual(forward);
  });

  it('produces opaque colours', () => {
    expect(colorsOf(BASE, PARAMS).every((c) => c.alpha === 1)).toBe(true);
  });

  it('keeps a grey base grey', () => {
    const colors = colorsOf('#7F7F7F', PARAMS);
    expect(colors.every((c) => /^#([0-9A-F]{2})\1\1$/.test(c.hex))).toBe(true);
  });

  it('rejects a base shade outside the range', () => {
    expect(errorOf(BASE, { ...PARAMS, baseShade: 950 })).toMatch(/50–900/);
    expect(errorOf(BASE, { ...PARAMS, baseShade: 0 })).toMatch(/50–900/);
    expect(errorOf(BASE, { ...PARAMS, baseShade: Number.NaN })).toMatch(/50–900/);
  });

  it('accepts a base shade on the boundary', () => {
    expect(colorsOf(BASE, { ...PARAMS, baseShade: 50 })[0]?.hex).toBe(BASE);
    expect(colorsOf(BASE, { ...PARAMS, baseShade: 900 }).at(-1)?.hex).toBe(BASE);
  });

  it('rejects an unusable base colour', () => {
    expect(errorOf('nope', PARAMS)).toMatch(/базовый цвет/);
  });

  it('passes the step-series errors through', () => {
    expect(errorOf(BASE, { ...PARAMS, step: 0 })).toMatch(/Шаг/);
    expect(errorOf(BASE, { ...PARAMS, from: 500, to: 500 })).toMatch(/совпадают/);
    expect(errorOf(BASE, { from: 0, to: 1000, step: 1, baseShade: 500 })).toMatch(/Слишком много/);
  });
});
