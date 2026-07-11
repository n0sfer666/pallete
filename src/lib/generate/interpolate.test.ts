import { describe, it, expect } from 'vitest';
import {
  generateInterpolate,
  type InterpolateParams,
  type InterpolateSpace,
} from '~/lib/generate/interpolate';
import { hexToOklab, hexToOklch, oklabToOklch } from '~/lib/color/oklch';

const base = (patch: Partial<InterpolateParams> = {}): InterpolateParams => ({
  fromHex: '#FF0000',
  fromAlpha: 1,
  toHex: '#0000FF',
  toAlpha: 1,
  count: 5,
  space: 'oklab',
  ...patch,
});

const unwrap = (params: InterpolateParams): { hex: string; alpha: number; name?: string }[] => {
  const result = generateInterpolate(params);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

const chromaOf = (hex: string): number => {
  const oklch = hexToOklch(hex);
  if (oklch === null) throw new Error(`unparsable ${hex}`);
  return oklch.c;
};

const hueOf = (hex: string): number => {
  const oklch = hexToOklch(hex);
  if (oklch === null) throw new Error(`unparsable ${hex}`);
  return oklch.h;
};

const hueGap = (from: number, to: number): number =>
  Math.abs(((to - from + 540) % 360) - 180);

const SPACES: InterpolateSpace[] = ['oklab', 'oklch'];

describe('generateInterpolate', () => {
  it('borrows the hue of the chromatic end when one end is achromatic', () => {
    for (const fromHex of ['#808080', '#FFFFFF', '#000000']) {
      const colors = unwrap(base({ fromHex, toHex: '#3B82F6', space: 'oklch' }));
      const target = hueOf('#3B82F6');
      for (const color of colors.slice(1)) {
        expect(hueGap(hueOf(color.hex), target)).toBeLessThanOrEqual(2);
      }
    }
  });

  it('borrows the hue in either direction', () => {
    const colors = unwrap(base({ fromHex: '#3B82F6', toHex: '#FFFFFF', space: 'oklch' }));
    const target = hueOf('#3B82F6');
    for (const color of colors.slice(0, -1)) {
      expect(hueGap(hueOf(color.hex), target)).toBeLessThanOrEqual(2);
    }
  });

  it('keeps a near-grey endpoint exact despite borrowing its hue for the arc', () => {
    for (const space of SPACES) {
      for (const grey of ['#CBD5E1', '#9CA3AF', '#E2E8F0', '#7F8081']) {
        const colors = unwrap(base({ fromHex: grey, toHex: '#F43F5E', space }));
        expect(colors[0]?.hex).toBe(grey);
        expect(colors[colors.length - 1]?.hex).toBe('#F43F5E');
      }
    }
  });

  it('treats a near-grey end as achromatic instead of dragging the arc through it', () => {
    const colors = unwrap(base({ fromHex: '#7F8081', toHex: '#FFD700', space: 'oklch' }));
    const target = hueOf('#FFD700');
    for (const color of colors.slice(1)) {
      expect(hueGap(hueOf(color.hex), target)).toBeLessThanOrEqual(3);
    }
  });

  it('maps an out-of-gamut oklab midpoint by chroma, keeping the hue of the straight mix', () => {
    const from = hexToOklab('#00FF00');
    const to = hexToOklab('#0000FF');
    if (from === null || to === null) throw new Error('unparsable');
    const t = 0.75;
    const ideal = oklabToOklch({
      l: from.l + (to.l - from.l) * t,
      a: from.a + (to.a - from.a) * t,
      b: from.b + (to.b - from.b) * t,
    });
    const mid = unwrap(base({ fromHex: '#00FF00', toHex: '#0000FF', count: 5 }))[3]?.hex ?? '';
    expect(hueGap(hueOf(mid), ideal.h)).toBeLessThanOrEqual(2);
    expect(chromaOf(mid)).toBeLessThan(ideal.c);
  });

  it('keeps both endpoints exact and numbers the colors', () => {
    const colors = unwrap(base());
    expect(colors).toHaveLength(5);
    expect(colors[0]?.hex).toBe('#FF0000');
    expect(colors[4]?.hex).toBe('#0000FF');
    expect(colors.map((c) => c.name)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('interpolates alpha linearly', () => {
    const colors = unwrap(base({ fromAlpha: 0, toAlpha: 1, count: 3 }));
    expect(colors.map((c) => c.alpha)).toEqual([0, 0.5, 1]);
  });

  it('supports the minimum count of two', () => {
    const colors = unwrap(base({ count: 2 }));
    expect(colors.map((c) => c.hex)).toEqual(['#FF0000', '#0000FF']);
  });

  it('keeps midpoints more saturated in oklch than in oklab', () => {
    const lab = unwrap(base({ count: 3, space: 'oklab' }));
    const lch = unwrap(base({ count: 3, space: 'oklch' }));
    const labMid = lab[1]?.hex ?? '';
    const lchMid = lch[1]?.hex ?? '';
    expect(chromaOf(lchMid)).toBeGreaterThan(chromaOf(labMid));
  });

  it('takes the short hue arc in oklch', () => {
    const colors = unwrap(base({ fromHex: '#FF0000', toHex: '#FF00FF', count: 3, space: 'oklch' }));
    const hue = hexToOklch(colors[1]?.hex ?? '')?.h ?? 0;
    expect(hue).toBeGreaterThan(340);
  });

  it('rejects a count below two', () => {
    expect(generateInterpolate(base({ count: 1 })).ok).toBe(false);
  });

  it('rejects a fractional count', () => {
    expect(generateInterpolate(base({ count: 4.5 })).ok).toBe(false);
  });

  it('rejects more than 64 colors', () => {
    expect(generateInterpolate(base({ count: 65 })).ok).toBe(false);
  });

  it('rejects an unparsable endpoint', () => {
    expect(generateInterpolate(base({ fromHex: 'nope' })).ok).toBe(false);
    expect(generateInterpolate(base({ toHex: '#GG0000' })).ok).toBe(false);
  });

  it('rejects an out-of-range alpha', () => {
    expect(generateInterpolate(base({ fromAlpha: 1.5 })).ok).toBe(false);
    expect(generateInterpolate(base({ toAlpha: Number.NaN })).ok).toBe(false);
  });
});
