import { oklchToHex } from '~/lib/color/oklch';
import type { Oklch } from '~/lib/color/types';
import { parseBase } from '~/lib/generate/base';
import { fail, genOk, type GeneratedColor, type GenResult } from '~/lib/generate/types';

export type TonalShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

interface TonalStep {
  shade: TonalShade;
  lightness: number;
  bell: number;
}

const LIGHTEST_STEP: TonalStep = { shade: 50, lightness: 0.97, bell: 0.3 };

const TONAL_STEPS: readonly TonalStep[] = [
  LIGHTEST_STEP,
  { shade: 100, lightness: 0.94, bell: 0.45 },
  { shade: 200, lightness: 0.89, bell: 0.65 },
  { shade: 300, lightness: 0.81, bell: 0.85 },
  { shade: 400, lightness: 0.71, bell: 0.97 },
  { shade: 500, lightness: 0.62, bell: 1 },
  { shade: 600, lightness: 0.55, bell: 0.98 },
  { shade: 700, lightness: 0.47, bell: 0.9 },
  { shade: 800, lightness: 0.4, bell: 0.78 },
  { shade: 900, lightness: 0.33, bell: 0.62 },
  { shade: 950, lightness: 0.2, bell: 0.45 },
];

const anchorFor = (lightness: number): TonalStep =>
  TONAL_STEPS.reduce(
    (closest, step) =>
      Math.abs(step.lightness - lightness) < Math.abs(closest.lightness - lightness)
        ? step
        : closest,
    LIGHTEST_STEP,
  );

const tonalHex = (step: TonalStep, anchor: TonalStep, base: Oklch, baseHex: string): string | null => {
  if (step.shade === anchor.shade) return baseHex;
  const chroma = (base.c * step.bell) / anchor.bell;
  return oklchToHex({ l: step.lightness, c: chroma, h: base.h });
};

export const tonalHexFor = (baseHex: string, shade: TonalShade): string | null => {
  const base = parseBase(baseHex);
  const step = TONAL_STEPS.find((candidate) => candidate.shade === shade);
  if (base === null || step === undefined) return null;
  return tonalHex(step, anchorFor(base.oklch.l), base.oklch, base.hex);
};

export const generateTonal = (baseHex: string): GenResult => {
  const base = parseBase(baseHex);
  if (base === null) return fail('Некорректный базовый цвет');

  const anchor = anchorFor(base.oklch.l);
  const colors: GeneratedColor[] = [];
  for (const step of TONAL_STEPS) {
    const hex = tonalHex(step, anchor, base.oklch, base.hex);
    if (hex === null) return fail('Не удалось построить ступень');
    colors.push({ hex, alpha: 1, name: String(step.shade) });
  }
  return genOk(colors);
};
