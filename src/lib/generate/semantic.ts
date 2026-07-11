import { oklchToHex } from '~/lib/color/oklch';
import type { Oklch } from '~/lib/color/types';
import { parseBase } from '~/lib/generate/base';
import { tonalHexFor, type TonalShade } from '~/lib/generate/tonal';
import { fail, genOk, type GeneratedColor, type GenResult } from '~/lib/generate/types';

export interface SemanticParams {
  withScale: boolean;
}

interface SemanticRole {
  name: string;
  hue: number | null;
  chroma: number | null;
}

const NEUTRAL_CHROMA = 0.02;

const SCALE_STEPS: { shade: TonalShade; suffix: string }[] = [
  { shade: 100, suffix: '-light' },
  { shade: 500, suffix: '' },
  { shade: 800, suffix: '-dark' },
];

const ROLES: SemanticRole[] = [
  { name: 'primary', hue: null, chroma: null },
  { name: 'success', hue: 145, chroma: null },
  { name: 'warning', hue: 75, chroma: null },
  { name: 'danger', hue: 25, chroma: null },
  { name: 'info', hue: 250, chroma: null },
  { name: 'neutral', hue: null, chroma: NEUTRAL_CHROMA },
];

const roleHex = (role: SemanticRole, base: Oklch, baseHex: string): string | null => {
  if (role.hue === null && role.chroma === null) return baseHex;
  return oklchToHex({
    l: base.l,
    c: role.chroma ?? base.c,
    h: role.hue ?? base.h,
  });
};

const scaleOf = (role: SemanticRole, hex: string): GeneratedColor[] | null => {
  const colors: GeneratedColor[] = [];
  for (const step of SCALE_STEPS) {
    const stepHex = tonalHexFor(hex, step.shade);
    if (stepHex === null) return null;
    colors.push({ hex: stepHex, alpha: 1, name: `${role.name}${step.suffix}` });
  }
  return colors;
};

export const generateSemantic = (baseHex: string, params: SemanticParams): GenResult => {
  const base = parseBase(baseHex);
  if (base === null) return fail('Некорректный базовый цвет');

  const colors: GeneratedColor[] = [];
  for (const role of ROLES) {
    const hex = roleHex(role, base.oklch, base.hex);
    if (hex === null) return fail('Не удалось построить роль');
    if (!params.withScale) {
      colors.push({ hex, alpha: 1, name: role.name });
      continue;
    }
    const scale = scaleOf(role, hex);
    if (scale === null) return fail('Не удалось построить шкалу роли');
    colors.push(...scale);
  }
  return genOk(colors);
};
