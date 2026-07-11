import { maxChromaFor, normalizeHue, oklchToHex } from '~/lib/color/oklch';
import { parseBase } from '~/lib/generate/base';
import { fail, genOk, type GeneratedColor, type GenResult } from '~/lib/generate/types';

export type HarmonyScheme =
  | 'complementary'
  | 'analogous'
  | 'triadic'
  | 'split'
  | 'tetradic';

export interface HarmonyParams {
  scheme: HarmonyScheme;
  angle: number;
}

interface HarmonyPoint {
  offset: number;
  name: string;
}

export const ANGLED_SCHEMES: HarmonyScheme[] = ['analogous', 'split'];

export const ANGLE_MIN = 0;

export const ANGLE_MAX = 180;

export const ANGLE_FIELD_MIN = 1;

export const ANGLE_FIELD_MAX = 179;

const pointsFor = (scheme: HarmonyScheme, angle: number): HarmonyPoint[] => {
  if (scheme === 'complementary') {
    return [
      { offset: 0, name: 'base' },
      { offset: 180, name: 'complement' },
    ];
  }
  if (scheme === 'analogous') {
    return [
      { offset: -angle, name: 'analogous-1' },
      { offset: 0, name: 'base' },
      { offset: angle, name: 'analogous-2' },
    ];
  }
  if (scheme === 'triadic') {
    return [
      { offset: 0, name: 'base' },
      { offset: 120, name: 'triadic-1' },
      { offset: 240, name: 'triadic-2' },
    ];
  }
  if (scheme === 'split') {
    return [
      { offset: 0, name: 'base' },
      { offset: 180 - angle, name: 'split-1' },
      { offset: 180 + angle, name: 'split-2' },
    ];
  }
  return [
    { offset: 0, name: 'base' },
    { offset: 90, name: 'tetradic-1' },
    { offset: 180, name: 'tetradic-2' },
    { offset: 270, name: 'tetradic-3' },
  ];
};

const isBase = (point: HarmonyPoint): boolean => point.name === 'base';

export const generateHarmony = (baseHex: string, params: HarmonyParams): GenResult => {
  const base = parseBase(baseHex);
  if (base === null) return fail('Некорректный базовый цвет');

  const needsAngle = ANGLED_SCHEMES.includes(params.scheme);
  const angleValid =
    Number.isFinite(params.angle) && params.angle > ANGLE_MIN && params.angle < ANGLE_MAX;
  if (needsAngle && !angleValid) {
    return fail(`Угол должен быть больше ${ANGLE_MIN} и меньше ${ANGLE_MAX}`);
  }

  const { l, c, h } = base.oklch;
  const points = pointsFor(params.scheme, params.angle);
  const hueOf = (point: HarmonyPoint): number => normalizeHue(h + point.offset);
  const shared = Math.min(
    c,
    ...points.filter((point) => !isBase(point)).map((point) => maxChromaFor(l, hueOf(point))),
  );

  const colors: GeneratedColor[] = [];
  for (const point of points) {
    const hex = isBase(point) ? base.hex : oklchToHex({ l, c: shared, h: hueOf(point) });
    if (hex === null) return fail('Не удалось построить цвет гармонии');
    colors.push({ hex, alpha: 1, name: point.name });
  }
  return genOk(colors);
};
