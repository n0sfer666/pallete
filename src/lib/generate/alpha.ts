import { parseBase } from '~/lib/generate/base';
import { buildSteps, ALPHA_MAX } from '~/lib/generate/steps';
import { fail, genOk, type GeneratedColor, type GenResult } from '~/lib/generate/types';

export interface AlphaParams {
  from: number;
  to: number;
  step: number;
}

export const generateAlpha = (baseHex: string, params: AlphaParams): GenResult => {
  const base = parseBase(baseHex);
  if (base === null) return fail('Некорректный базовый цвет');
  const { hex } = base;

  const series = buildSteps(params.from, params.to, params.step, ALPHA_MAX);
  if (!series.ok) return fail(series.error);

  const colors: GeneratedColor[] = series.value.map((percent) => ({
    hex,
    alpha: percent / 100,
    name: String(percent),
  }));
  return genOk(colors);
};
