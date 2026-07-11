import { describe, it, expect } from 'vitest';
import { generateTonal } from '~/lib/generate/tonal';
import { hexToOklch } from '~/lib/color/oklch';

const unwrap = (hex: string): { hex: string; name?: string }[] => {
  const result = generateTonal(hex);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const oklchOf = (hex: string): { l: number; c: number } => {
  const oklch = hexToOklch(hex);
  if (oklch === null) throw new Error(`unparsable ${hex}`);
  return oklch;
};

const hexAt = (base: string, shade: string): string | undefined =>
  unwrap(base).find((color) => color.name === shade)?.hex;

const chromaAt = (colors: { hex: string; name?: string }[], shade: string): number => {
  const found = colors.find((color) => color.name === shade);
  return found === undefined ? 0 : oklchOf(found.hex).c;
};

describe('generateTonal', () => {
  it('produces the eleven fixed steps', () => {
    expect(unwrap('#3B82F6').map((color) => color.name)).toEqual([
      '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
    ]);
  });

  it('reproduces the base hex exactly at the anchor step', () => {
    expect(hexAt('#3B82F6', '500')).toBe('#3B82F6');
    expect(hexAt('#FFFF00', '50')).toBe('#FFFF00');
    expect(hexAt('#0000FF', '700')).toBe('#0000FF');
    expect(hexAt('#000000', '950')).toBe('#000000');
    expect(hexAt('#FFFFFF', '50')).toBe('#FFFFFF');
  });

  it('normalizes a shorthand base hex at the anchor', () => {
    expect(hexAt('#0af', '400')).toBe('#00AAFF');
  });

  it('darkens monotonically from 50 to 950', () => {
    const lightness = unwrap('#3B82F6').map((color) => oklchOf(color.hex).l);
    for (let i = 1; i < lightness.length; i += 1) {
      expect(lightness[i]).toBeLessThan(lightness[i - 1] ?? 1);
    }
  });

  it('follows the chroma bell when the base anchors at 500', () => {
    const colors = unwrap('#3B82F6');
    expect(chromaAt(colors, '500')).toBeGreaterThan(chromaAt(colors, '50'));
    expect(chromaAt(colors, '500')).toBeGreaterThan(chromaAt(colors, '950'));
  });

  it('peaks the chroma at a light anchor: the bell cannot lift mid steps past the sRGB gamut', () => {
    const chroma = unwrap('#FFFF00').map((color) => oklchOf(color.hex).c);
    for (let i = 1; i < chroma.length; i += 1) {
      expect(chroma[i]).toBeLessThan(chroma[i - 1] ?? 1);
    }
  });

  it('keeps a grey base grey', () => {
    for (const color of unwrap('#7F7F7F')) {
      expect(oklchOf(color.hex).c).toBeLessThan(0.005);
    }
  });

  it('emits eleven distinct hexes for edge bases', () => {
    for (const base of ['#FFFFFF', '#000000', '#7F7F7F', '#FFFF00', '#3B82F6']) {
      const hexes = unwrap(base).map((color) => color.hex);
      expect(new Set(hexes).size).toBe(11);
    }
  });

  it('anchors on the nearer step across the 50/100 boundary', () => {
    expect(hexAt('#F0F0F0', '50')).toBe('#F0F0F0');
    expect(hexAt('#EFEFEF', '100')).toBe('#EFEFEF');
  });

  it('rejects an unparsable base', () => {
    const result = generateTonal('nope');
    expect(result.ok).toBe(false);
  });
});
