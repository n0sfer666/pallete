import type { Oklab, Oklch } from '~/lib/color/types';
import { normalizeHue, oklabToOklch, oklchToHex, oklchToOklab } from '~/lib/color/oklch';
import { parseBase, type ParsedBase } from '~/lib/generate/base';
import {
  fail,
  genOk,
  tooManyColors,
  MAX_GENERATED,
  type GeneratedColor,
  type GenResult,
} from '~/lib/generate/types';

export type InterpolateSpace = 'oklab' | 'oklch';

export interface InterpolateParams {
  fromHex: string;
  fromAlpha: number;
  toHex: string;
  toAlpha: number;
  count: number;
  space: InterpolateSpace;
}

export const MIN_COUNT = 2;

type HexAt = (t: number) => string | null;

const mix = (from: number, to: number, t: number): number => from + (to - from) * t;

const mixHue = (from: number, to: number, t: number): number => {
  const delta = ((to - from + 540) % 360) - 180;
  return normalizeHue(from + delta * t);
};

const labMixer = (from: Oklab, to: Oklab): HexAt => (t) =>
  oklchToHex(
    oklabToOklch({
      l: mix(from.l, to.l, t),
      a: mix(from.a, to.a, t),
      b: mix(from.b, to.b, t),
    }),
  );

const ACHROMATIC_CHROMA = 0.02;

const isAchromatic = (color: Oklch): boolean => color.c < ACHROMATIC_CHROMA;

const hueEndpoints = (from: Oklch, to: Oklch): { from: number; to: number } => {
  if (isAchromatic(from) && isAchromatic(to)) return { from: from.h, to: to.h };
  if (isAchromatic(from)) return { from: to.h, to: to.h };
  if (isAchromatic(to)) return { from: from.h, to: from.h };
  return { from: from.h, to: to.h };
};

const lchMixer = (from: Oklch, to: Oklch): HexAt => {
  const hues = hueEndpoints(from, to);
  return (t) =>
    oklchToHex({
      l: mix(from.l, to.l, t),
      c: mix(from.c, to.c, t),
      h: mixHue(hues.from, hues.to, t),
    });
};

const withExactEnds = (hexAt: HexAt, from: string, to: string): HexAt => (t) => {
  if (t === 0) return from;
  if (t === 1) return to;
  return hexAt(t);
};

const mixerFor = (space: InterpolateSpace, from: ParsedBase, to: ParsedBase): HexAt => {
  const mixer =
    space === 'oklch'
      ? lchMixer(from.oklch, to.oklch)
      : labMixer(oklchToOklab(from.oklch), oklchToOklab(to.oklch));
  return withExactEnds(mixer, from.hex, to.hex);
};

const isAlpha = (value: number): boolean => Number.isFinite(value) && value >= 0 && value <= 1;

export const generateInterpolate = (params: InterpolateParams): GenResult => {
  const from = parseBase(params.fromHex);
  if (from === null) return fail('Некорректный цвет A');
  const to = parseBase(params.toHex);
  if (to === null) return fail('Некорректный цвет B');
  if (!isAlpha(params.fromAlpha) || !isAlpha(params.toAlpha)) {
    return fail('Прозрачность должна быть от 0 до 1');
  }
  if (!Number.isSafeInteger(params.count) || params.count < MIN_COUNT) {
    return fail(`Количество цветов — целое число не меньше ${MIN_COUNT}`);
  }
  if (params.count > MAX_GENERATED) return fail(tooManyColors(params.count));

  const hexAt = mixerFor(params.space, from, to);

  const colors: GeneratedColor[] = [];
  for (let index = 0; index < params.count; index += 1) {
    const t = index / (params.count - 1);
    const hex = hexAt(t);
    if (hex === null) return fail('Не удалось построить цвет');
    colors.push({
      hex,
      alpha: mix(params.fromAlpha, params.toAlpha, t),
      name: String(index + 1),
    });
  }
  return genOk(colors);
};
