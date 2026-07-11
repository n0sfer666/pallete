import { describe, it, expect } from 'vitest';
import { generateSemantic } from '~/lib/generate/semantic';
import { hexToOklch, maxChromaFor } from '~/lib/color/oklch';

const unwrap = (hex: string, withScale = false): { hex: string; name?: string }[] => {
  const result = generateSemantic(hex, { withScale });
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const oklchOf = (hex: string): { l: number; c: number; h: number } => {
  const oklch = hexToOklch(hex);
  if (oklch === null) throw new Error(`unparsable ${hex}`);
  return oklch;
};

const roleOklch = (
  colors: { hex: string; name?: string }[],
  name: string,
): { l: number; c: number; h: number } => {
  const found = colors.find((color) => color.name === name);
  if (found === undefined) throw new Error(`missing role ${name}`);
  return oklchOf(found.hex);
};

const hueGap = (from: number, to: number): number =>
  Math.abs(((to - from + 540) % 360) - 180);

const expectHueNear = (actual: number, expected: number, tolerance: number): void => {
  expect(hueGap(actual, expected)).toBeLessThanOrEqual(tolerance);
};

const BASE = '#3B82F6';

describe('generateSemantic', () => {
  it('emits the six roles in order', () => {
    expect(unwrap(BASE).map((color) => color.name)).toEqual([
      'primary', 'success', 'warning', 'danger', 'info', 'neutral',
    ]);
  });

  it('reproduces the base hex for primary', () => {
    expect(unwrap(BASE)[0]?.hex).toBe(BASE);
  });

  it('pins the semantic hues regardless of the base', () => {
    for (const base of [BASE, '#F43F5E', '#84CC16']) {
      const colors = unwrap(base);
      expectHueNear(roleOklch(colors, 'success').h, 145, 2);
      expectHueNear(roleOklch(colors, 'warning').h, 75, 2);
      expectHueNear(roleOklch(colors, 'danger').h, 25, 2);
      expectHueNear(roleOklch(colors, 'info').h, 250, 2);
    }
  });

  it('inherits the base lightness for every role', () => {
    const colors = unwrap(BASE);
    const base = oklchOf(BASE);
    for (const color of colors) {
      expect(oklchOf(color.hex).l).toBeCloseTo(base.l, 1);
    }
  });

  it('tints neutral with the base hue at a low chroma', () => {
    const colors = unwrap(BASE);
    const neutral = roleOklch(colors, 'neutral');
    expect(neutral.c).toBeCloseTo(0.02, 2);
    expectHueNear(neutral.h, oklchOf(BASE).h, 6);
  });

  it('clamps an over-saturated role chroma into the gamut', () => {
    for (const color of unwrap('#00FF00')) {
      const { l, c, h } = oklchOf(color.hex);
      expect(c).toBeLessThanOrEqual(maxChromaFor(l, h) + 0.005);
    }
  });

  it('keeps a grey base grey except for the neutral tint, as the spec allows', () => {
    const colors = unwrap('#808080');
    for (const color of colors.filter((role) => role.name !== 'neutral')) {
      expect(oklchOf(color.hex).c).toBeLessThan(0.005);
    }
  });

  it('collapses an extreme base into one color', () => {
    expect(new Set(unwrap('#FFFFFF').map((color) => color.hex)).size).toBe(1);
    expect(new Set(unwrap('#000000').map((color) => color.hex)).size).toBe(1);
  });

  it('expands each role into a three-step scale when asked', () => {
    const names = unwrap(BASE, true).map((color) => color.name);
    expect(names).toHaveLength(18);
    expect(names.slice(0, 3)).toEqual(['primary-light', 'primary', 'primary-dark']);
    expect(names.slice(15)).toEqual(['neutral-light', 'neutral', 'neutral-dark']);
  });

  it('darkens each scale from light to dark', () => {
    const colors = unwrap(BASE, true);
    const light = roleOklch(colors, 'danger-light');
    const mid = roleOklch(colors, 'danger');
    const dark = roleOklch(colors, 'danger-dark');
    expect(light.l).toBeGreaterThan(mid.l);
    expect(mid.l).toBeGreaterThan(dark.l);
  });

  it('rejects an unparsable base', () => {
    expect(generateSemantic('nope', { withScale: false }).ok).toBe(false);
  });
});
