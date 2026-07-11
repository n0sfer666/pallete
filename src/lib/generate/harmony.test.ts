import { describe, it, expect } from 'vitest';
import {
  ANGLE_FIELD_MAX,
  ANGLE_FIELD_MIN,
  ANGLE_MAX,
  ANGLE_MIN,
  generateHarmony,
  type HarmonyScheme,
} from '~/lib/generate/harmony';
import { hexToOklch, maxChromaFor } from '~/lib/color/oklch';

const SCHEMES: HarmonyScheme[] = ['complementary', 'analogous', 'triadic', 'split', 'tetradic'];

const unwrap = (
  hex: string,
  scheme: HarmonyScheme,
  angle = 30,
): { hex: string; name?: string }[] => {
  const result = generateHarmony(hex, { scheme, angle });
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const oklchOf = (hex: string): { l: number; c: number; h: number } => {
  const oklch = hexToOklch(hex);
  if (oklch === null) throw new Error(`unparsable ${hex}`);
  return oklch;
};

const HUE_TOLERANCE = 2;

const hueGap = (from: number, to: number): number =>
  Math.abs(((to - from + 540) % 360) - 180);

const expectHueGap = (from: number, to: number, expected: number): void => {
  expect(Math.abs(hueGap(from, to) - expected)).toBeLessThanOrEqual(HUE_TOLERANCE);
};

const BASE = '#3B82F6';

describe('generateHarmony', () => {
  it('names the complementary pair', () => {
    const colors = unwrap(BASE, 'complementary');
    expect(colors.map((color) => color.name)).toEqual(['base', 'complement']);
    expect(colors[0]?.hex).toBe(BASE);
  });

  it('rotates the complement by 180 degrees', () => {
    const colors = unwrap(BASE, 'complementary');
    expectHueGap(oklchOf(BASE).h, oklchOf(colors[1]?.hex ?? BASE).h, 180);
  });

  it('places analogous colors around the base', () => {
    const colors = unwrap(BASE, 'analogous', 40);
    expect(colors.map((color) => color.name)).toEqual(['analogous-1', 'base', 'analogous-2']);
    const base = oklchOf(BASE);
    expectHueGap(base.h, oklchOf(colors[0]?.hex ?? BASE).h, 40);
    expectHueGap(base.h, oklchOf(colors[2]?.hex ?? BASE).h, 40);
  });

  it('splits the complement by the angle', () => {
    const colors = unwrap(BASE, 'split', 30);
    expect(colors.map((color) => color.name)).toEqual(['base', 'split-1', 'split-2']);
    const base = oklchOf(BASE);
    expectHueGap(base.h, oklchOf(colors[1]?.hex ?? BASE).h, 150);
    expectHueGap(base.h, oklchOf(colors[2]?.hex ?? BASE).h, 150);
  });

  it('names triadic and tetradic points', () => {
    expect(unwrap(BASE, 'triadic').map((color) => color.name)).toEqual([
      'base', 'triadic-1', 'triadic-2',
    ]);
    expect(unwrap(BASE, 'tetradic').map((color) => color.name)).toEqual([
      'base', 'tetradic-1', 'tetradic-2', 'tetradic-3',
    ]);
  });

  it('gives the derived colors one shared chroma and the base lightness', () => {
    const colors = unwrap(BASE, 'triadic');
    const base = oklchOf(BASE);
    const derived = colors.slice(1).map((color) => oklchOf(color.hex));
    for (const color of derived) {
      expect(color.l).toBeCloseTo(base.l, 2);
      expect(color.c).toBeCloseTo(derived[0]?.c ?? 0, 2);
    }
  });

  it('keeps every derived color inside the sRGB gamut', () => {
    for (const scheme of SCHEMES) {
      for (const color of unwrap('#00FF00', scheme)) {
        const { l, c, h } = oklchOf(color.hex);
        expect(c).toBeLessThanOrEqual(maxChromaFor(l, h) + 0.005);
      }
    }
  });

  it('never lets a derived color out-saturate the base', () => {
    for (const scheme of SCHEMES) {
      const colors = unwrap('#9DB4C0', scheme);
      const baseChroma = oklchOf('#9DB4C0').c;
      for (const color of colors) {
        expect(oklchOf(color.hex).c).toBeLessThanOrEqual(baseChroma + 0.005);
      }
    }
  });

  it('keeps a grey base grey, as the spec allows', () => {
    for (const color of unwrap('#808080', 'tetradic')) {
      expect(oklchOf(color.hex).c).toBeLessThan(0.005);
    }
  });

  it('collapses an extreme base to itself', () => {
    expect(unwrap('#000000', 'triadic').map((color) => color.hex)).toEqual([
      '#000000', '#000000', '#000000',
    ]);
  });

  it('rejects an out-of-range angle only where the angle matters', () => {
    expect(generateHarmony(BASE, { scheme: 'analogous', angle: 0 }).ok).toBe(false);
    expect(generateHarmony(BASE, { scheme: 'split', angle: 180 }).ok).toBe(false);
    expect(generateHarmony(BASE, { scheme: 'triadic', angle: 0 }).ok).toBe(true);
  });

  it('rejects an unparsable base', () => {
    expect(generateHarmony('nope', { scheme: 'triadic', angle: 30 }).ok).toBe(false);
  });

  it('keeps the angle field bounds inside the accepted range', () => {
    expect(ANGLE_FIELD_MIN).toBeGreaterThan(ANGLE_MIN);
    expect(ANGLE_FIELD_MAX).toBeLessThan(ANGLE_MAX);
    expect(generateHarmony(BASE, { scheme: 'analogous', angle: ANGLE_FIELD_MIN }).ok).toBe(true);
    expect(generateHarmony(BASE, { scheme: 'analogous', angle: ANGLE_FIELD_MAX }).ok).toBe(true);
  });
});
