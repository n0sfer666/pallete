import { oklchToHex } from '~/lib/color/oklch';
import { parseBase } from '~/lib/generate/base';
import { buildSteps, SHADE_MAX } from '~/lib/generate/steps';
import { fail, genOk, type GeneratedColor, type GenResult } from '~/lib/generate/types';

export interface ShadeParams {
  from: number;
  to: number;
  step: number;
  baseShade: number;
}

const shiftLightness = (l: number, shift: number): number =>
  shift > 0 ? l + shift * (1 - l) : l + shift * l;

const hasDuplicates = (colors: GeneratedColor[]): boolean =>
  new Set(colors.map((color) => color.hex)).size !== colors.length;

export const generateShade = (baseHex: string, params: ShadeParams): GenResult => {
  const parsed = parseBase(baseHex);
  if (parsed === null) return fail('Некорректный базовый цвет');
  const base = parsed.oklch;

  const series = buildSteps(params.from, params.to, params.step, SHADE_MAX);
  if (!series.ok) return fail(series.error);

  const lo = Math.min(params.from, params.to);
  const hi = Math.max(params.from, params.to);
  const { baseShade } = params;
  if (!Number.isSafeInteger(baseShade) || baseShade < lo || baseShade > hi) {
    return fail(`Базовый оттенок должен быть в диапазоне ${lo}–${hi}`);
  }

  const colors: GeneratedColor[] = [];
  for (const shade of series.value) {
    const hex = oklchToHex({ ...base, l: shiftLightness(base.l, (baseShade - shade) / 1000) });
    if (hex === null) return fail('Не удалось построить оттенок');
    colors.push({ hex, alpha: 1, name: String(shade) });
  }
  if (hasDuplicates(colors)) {
    return fail('Шкала вырождается: соседние оттенки совпадают. Измените базовый цвет или шаг');
  }
  return genOk(colors);
};
