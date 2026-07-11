import { describe, it, expect } from 'vitest';
import { generateAlpha, type AlphaParams } from '~/lib/generate/alpha';

const params = (patch: Partial<AlphaParams> = {}): AlphaParams => ({
  from: 10,
  to: 100,
  step: 10,
  ...patch,
});

const unwrap = (baseHex: string, p: AlphaParams): { hex: string; alpha: number; name?: string }[] => {
  const result = generateAlpha(baseHex, p);
  if (!result.ok) throw new Error(result.error);
  return result.value;
};

describe('generateAlpha', () => {
  it('ramps alpha over the step series and keeps one hex', () => {
    const colors = unwrap('#3B82F6', params());
    expect(colors.map((c) => c.name)).toEqual([
      '10', '20', '30', '40', '50', '60', '70', '80', '90', '100',
    ]);
    expect(colors.map((c) => c.alpha)).toEqual([
      0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1,
    ]);
    expect(new Set(colors.map((c) => c.hex))).toEqual(new Set(['#3B82F6']));
  });

  it('keeps both typed boundaries when the range is not a multiple of the step', () => {
    expect(unwrap('#3B82F6', params({ from: 5, to: 45, step: 20 })).map((c) => c.name)).toEqual([
      '5', '20', '40', '45',
    ]);
  });

  it('sorts ascending regardless of the typed direction', () => {
    expect(unwrap('#3B82F6', params({ from: 80, to: 20, step: 20 })).map((c) => c.name)).toEqual([
      '20', '40', '60', '80',
    ]);
  });

  it('normalizes a shorthand base hex', () => {
    expect(unwrap('#0af', params({ from: 50, to: 100, step: 50 }))[0]?.hex).toBe('#00AAFF');
  });

  it('rejects a boundary above 100 percent', () => {
    expect(generateAlpha('#3B82F6', params({ to: 120 })).ok).toBe(false);
  });

  it('rejects an unparsable base color', () => {
    expect(generateAlpha('nope', params()).ok).toBe(false);
  });

  it('rejects a zero step', () => {
    expect(generateAlpha('#3B82F6', params({ step: 0 })).ok).toBe(false);
  });
});
