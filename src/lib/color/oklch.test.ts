import { describe, it, expect } from 'vitest';
import {
  clampChromaToGamut,
  hexToOklab,
  hexToOklch,
  isInSrgbGamut,
  maxChromaFor,
  normalizeHue,
  oklabToHex,
  oklabToRgb,
  oklchToHex,
  oklchToOklab,
} from '~/lib/color/oklch';
import type { Oklch } from '~/lib/color/types';

const ANCHORS = ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#3B82F6', '#7F7F7F'];
const LIGHTNESS_SWEEP = [0.1, 0.3, 0.5, 0.62, 0.8, 0.95];
const HUE_SWEEP = [0, 29, 75, 145, 200, 264, 330];

const oklch = (hex: string): Oklch => {
  const value = hexToOklch(hex);
  if (value === null) throw new Error(`unparsable hex: ${hex}`);
  return value;
};

const randomHex = (seed: number): string => {
  const next = (seed * 1103515245 + 12345) & 0x7fffffff;
  return `#${(next & 0xffffff).toString(16).padStart(6, '0').toUpperCase()}`;
};

describe('oklch round-trip', () => {
  it.each(ANCHORS)('restores %s exactly', (hex) => {
    expect(oklchToHex(oklch(hex))).toBe(hex);
  });

  it.each(ANCHORS)('restores %s through oklab', (hex) => {
    const lab = hexToOklab(hex);
    expect(lab).not.toBeNull();
    if (lab !== null) expect(oklabToHex(lab)).toBe(hex);
  });

  it('restores 5000 pseudo-random colors bit-for-bit', () => {
    const broken: string[] = [];
    let seed = 7;
    for (let i = 0; i < 5000; i += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const hex = randomHex(seed);
      if (oklchToHex(oklch(hex)) !== hex) broken.push(hex);
    }
    expect(broken).toEqual([]);
  });

  it('returns null for malformed hex', () => {
    expect(hexToOklch('nope')).toBeNull();
    expect(hexToOklab('#12345')).toBeNull();
  });
});

describe('oklch components', () => {
  it('maps black and white to the lightness poles with no chroma', () => {
    expect(oklch('#000000').l).toBeCloseTo(0, 5);
    expect(oklch('#FFFFFF').l).toBeCloseTo(1, 5);
    expect(oklch('#7F7F7F').c).toBeCloseTo(0, 5);
  });

  it('orders primaries by hue', () => {
    expect(oklch('#FF0000').h).toBeCloseTo(29.23, 1);
    expect(oklch('#00FF00').h).toBeCloseTo(142.5, 1);
    expect(oklch('#0000FF').h).toBeCloseTo(264.05, 1);
  });

  it('wraps hue into [0, 360)', () => {
    expect(normalizeHue(400)).toBeCloseTo(40, 5);
    expect(normalizeHue(-30)).toBeCloseTo(330, 5);
    expect(normalizeHue(360)).toBe(0);
  });
});

describe('gamut clamp', () => {
  it('leaves reachable colors untouched', () => {
    const base = oklch('#3B82F6');
    expect(clampChromaToGamut(base)).toEqual(base);
  });

  it('pulls unreachable chroma back into sRGB', () => {
    const clamped = clampChromaToGamut({ l: 0.62, c: 0.35, h: 264 });
    expect(clamped.c).toBeLessThan(0.35);
    expect(clamped.l).toBeCloseTo(0.62, 5);
    expect(clamped.h).toBe(264);
    expect(isInSrgbGamut(oklchToOklab(clamped))).toBe(true);
  });

  it('converges for absurdly large chroma instead of collapsing to grey', () => {
    const huge = clampChromaToGamut({ l: 0.6, c: 1e6, h: 264 });
    expect(huge.c).toBeCloseTo(maxChromaFor(0.6, 264), 3);
    expect(isInSrgbGamut(oklchToOklab(huge))).toBe(true);
  });

  it('refuses infinite chroma rather than inventing a colour', () => {
    expect(oklchToHex({ l: 0.6, c: Number.POSITIVE_INFINITY, h: 264 })).toBeNull();
  });

  it('normalizes hue instead of carrying it out of range', () => {
    expect(clampChromaToGamut({ l: 0.6, c: 0.5, h: 400 }).h).toBeCloseTo(40, 5);
    expect(clampChromaToGamut({ l: 0.6, c: 0.1, h: -30 }).h).toBeCloseTo(330, 5);
  });

  it('clips lightness outside [0, 1] and negative chroma', () => {
    expect(clampChromaToGamut({ l: 1.4, c: 0.1, h: 30 }).l).toBe(1);
    expect(clampChromaToGamut({ l: -0.2, c: 0.1, h: 30 }).l).toBe(0);
    expect(clampChromaToGamut({ l: 0.5, c: -0.1, h: 30 }).c).toBe(0);
  });

  it('passes non-finite input through so the hex layer can refuse it', () => {
    expect(oklchToHex({ l: Number.NaN, c: 0.1, h: 30 })).toBeNull();
    expect(oklchToHex({ l: 0.5, c: Number.NaN, h: 30 })).toBeNull();
    expect(oklchToHex({ l: 0.5, c: 0.1, h: Number.NaN })).toBeNull();
  });
});

describe('maxChromaFor', () => {
  it('collapses to the achromatic poles', () => {
    expect(maxChromaFor(0, 30)).toBe(0);
    expect(maxChromaFor(1, 30)).toBe(0);
    expect(oklchToHex({ l: 0, c: 0.3, h: 30 })).toBe('#000000');
    expect(oklchToHex({ l: 1, c: 0.3, h: 30 })).toBe('#FFFFFF');
  });

  it('sits on the gamut boundary across the lightness and hue sweep', () => {
    for (const l of LIGHTNESS_SWEEP) {
      for (const h of HUE_SWEEP) {
        const c = maxChromaFor(l, h);
        expect(isInSrgbGamut(oklchToOklab({ l, c, h }))).toBe(true);
        expect(isInSrgbGamut(oklchToOklab({ l, c: c + 0.02, h }))).toBe(false);
      }
    }
  });

  it('stays within the sRGB chroma range at mid lightness', () => {
    expect(maxChromaFor(0.62, 264)).toBeGreaterThan(0.1);
    expect(maxChromaFor(0.62, 264)).toBeLessThan(0.4);
  });
});

describe('oklabToRgb', () => {
  it('reports channels outside [0, 1] for unreachable colors', () => {
    const { r, g, b } = oklabToRgb(oklchToOklab({ l: 0.62, c: 0.35, h: 264 }));
    expect([r, g, b].some((channel) => channel < 0 || channel > 1)).toBe(true);
  });
});
