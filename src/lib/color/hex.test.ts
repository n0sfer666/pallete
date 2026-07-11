import { describe, it, expect } from 'vitest';
import { formatHex, parseHex, withAlpha } from '~/lib/color/hex';

describe('parseHex', () => {
  it('parses six-digit hex without alpha', () => {
    expect(parseHex('#FF0000')).toEqual({ rgb: { r: 1, g: 0, b: 0 }, alpha: null });
  });

  it('parses eight-digit hex with alpha', () => {
    const parsed = parseHex('#00FF0080');
    expect(parsed?.rgb).toEqual({ r: 0, g: 1, b: 0 });
    expect(parsed?.alpha).toBeCloseTo(128 / 255, 5);
  });

  it('expands three- and four-digit shorthand', () => {
    expect(parseHex('#FFF')?.rgb).toEqual({ r: 1, g: 1, b: 1 });
    expect(parseHex('#0af')).toEqual(parseHex('#00AAFF'));
    expect(parseHex('#0af8')?.alpha).toBeCloseTo(0x88 / 255, 5);
  });

  it('tolerates missing hash and surrounding spaces', () => {
    expect(parseHex('  3b82f6 ')).toEqual(parseHex('#3B82F6'));
  });

  it('rejects malformed input', () => {
    expect(parseHex('#FFFFF')).toBeNull();
    expect(parseHex('#GGGGGG')).toBeNull();
    expect(parseHex('')).toBeNull();
    expect(parseHex('rgb(0,0,0)')).toBeNull();
  });
});

describe('formatHex', () => {
  it('formats uppercase', () => {
    expect(formatHex({ r: 1, g: 0, b: 0.2314 })).toBe('#FF003B');
  });

  it('clips channels outside [0, 1]', () => {
    expect(formatHex({ r: 1.4, g: -0.3, b: 0 })).toBe('#FF0000');
  });

  it('refuses non-finite channels instead of emitting garbage', () => {
    expect(formatHex({ r: Number.NaN, g: 0, b: 0 })).toBeNull();
    expect(formatHex({ r: 0, g: Number.POSITIVE_INFINITY, b: 0 })).toBeNull();
  });
});

describe('withAlpha', () => {
  it('keeps six digits when opaque', () => {
    expect(withAlpha('#3B82F6', 1)).toBe('#3B82F6');
  });

  it('appends the alpha byte when translucent', () => {
    expect(withAlpha('#3B82F6', 0.5)).toBe('#3B82F680');
    expect(withAlpha('#3B82F6', 0)).toBe('#3B82F600');
  });

  it('normalizes the base hex', () => {
    expect(withAlpha('#0af', 1)).toBe('#00AAFF');
  });

  it('returns null on unusable input', () => {
    expect(withAlpha('nope', 1)).toBeNull();
    expect(withAlpha('#3B82F6', Number.NaN)).toBeNull();
  });
});
