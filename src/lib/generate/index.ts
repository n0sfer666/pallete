import { generateShade, type ShadeParams } from '~/lib/generate/shade';
import { generateTonal } from '~/lib/generate/tonal';
import { generateInterpolate, type InterpolateParams } from '~/lib/generate/interpolate';
import { generateAlpha, type AlphaParams } from '~/lib/generate/alpha';
import { generateHarmony, type HarmonyParams } from '~/lib/generate/harmony';
import { generateSemantic, type SemanticParams } from '~/lib/generate/semantic';
import { type GeneratorMode, type GenResult } from '~/lib/generate/types';

export interface GeneratorParams {
  mode: GeneratorMode;
  baseHex: string;
  shade: ShadeParams;
  interpolate: InterpolateParams;
  alpha: AlphaParams;
  harmony: HarmonyParams;
  semantic: SemanticParams;
}

const GENERATORS: Record<GeneratorMode, (params: GeneratorParams) => GenResult> = {
  shade: (params) => generateShade(params.baseHex, params.shade),
  tonal: (params) => generateTonal(params.baseHex),
  interpolate: (params) => generateInterpolate(params.interpolate),
  alpha: (params) => generateAlpha(params.baseHex, params.alpha),
  harmony: (params) => generateHarmony(params.baseHex, params.harmony),
  semantic: (params) => generateSemantic(params.baseHex, params.semantic),
};

export const generate = (params: GeneratorParams): GenResult => GENERATORS[params.mode](params);
