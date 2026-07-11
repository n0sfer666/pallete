import { generateShade, type ShadeParams } from '~/lib/generate/shade';
import { fail, type GeneratorMode, type GenResult } from '~/lib/generate/types';

export interface GeneratorParams {
  mode: GeneratorMode;
  baseHex: string;
  shade: ShadeParams;
}

export const generate = (params: GeneratorParams): GenResult => {
  if (params.mode === 'shade') return generateShade(params.baseHex, params.shade);
  return fail('Режим пока не поддерживается');
};
