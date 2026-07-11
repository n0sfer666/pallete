import { createStore, produce } from 'solid-js/store';
import type { GeneratorParams } from '~/lib/generate';
import type { ShadeParams } from '~/lib/generate/shade';
import type { AlphaParams } from '~/lib/generate/alpha';
import type { InterpolateParams } from '~/lib/generate/interpolate';
import type { HarmonyParams, HarmonyScheme } from '~/lib/generate/harmony';
import type { SemanticParams } from '~/lib/generate/semantic';
import type { GeneratorMode } from '~/lib/generate/types';

export interface GeneratorState extends GeneratorParams {
  applied: string | null;
}

const DEFAULT_BASE_HEX = '#3B82F6';

const defaultShade = (): ShadeParams => ({ from: 50, to: 900, step: 100, baseShade: 500 });

const defaultInterpolate = (): InterpolateParams => ({
  fromHex: DEFAULT_BASE_HEX,
  fromAlpha: 1,
  toHex: '#F43F5E',
  toAlpha: 1,
  count: 5,
  space: 'oklab',
});

const defaultAlpha = (): AlphaParams => ({ from: 10, to: 100, step: 10 });

const defaultHarmony = (): HarmonyParams => ({ scheme: 'complementary', angle: 30 });

const defaultSemantic = (): SemanticParams => ({ withScale: false });

const defaultState = (): GeneratorState => ({
  applied: null,
  mode: 'shade',
  baseHex: DEFAULT_BASE_HEX,
  shade: defaultShade(),
  interpolate: defaultInterpolate(),
  alpha: defaultAlpha(),
  harmony: defaultHarmony(),
  semantic: defaultSemantic(),
});

const [state, setState] = createStore<Record<string, GeneratorState>>({});

export const generatorFor = (paletteId: string): GeneratorState | undefined => state[paletteId];

export const isGeneratorEnabled = (paletteId: string): boolean => state[paletteId] !== undefined;

export const enableGenerator = (paletteId: string): void => setState(paletteId, defaultState());

export const disableGenerator = (paletteId: string): void =>
  setState(produce((all) => {
    delete all[paletteId];
  }));

export const clearGenerators = (): void =>
  setState(produce((all) => {
    for (const key of Object.keys(all)) delete all[key];
  }));

export const setMode = (paletteId: string, mode: GeneratorMode): void =>
  setState(paletteId, 'mode', mode);

export const setBaseHex = (paletteId: string, baseHex: string): void =>
  setState(paletteId, 'baseHex', baseHex);

export const setShadeParam = (paletteId: string, key: keyof ShadeParams, value: number): void =>
  setState(paletteId, 'shade', key, value);

export const setAlphaParam = (paletteId: string, key: keyof AlphaParams, value: number): void =>
  setState(paletteId, 'alpha', key, value);

export const setInterpolateHex = (
  paletteId: string,
  key: 'fromHex' | 'toHex',
  value: string,
): void => setState(paletteId, 'interpolate', key, value);

export const setInterpolateNumber = (
  paletteId: string,
  key: 'fromAlpha' | 'toAlpha' | 'count',
  value: number,
): void => setState(paletteId, 'interpolate', key, value);

export const setInterpolateSpace = (
  paletteId: string,
  space: InterpolateParams['space'],
): void => setState(paletteId, 'interpolate', 'space', space);

export const setHarmonyScheme = (paletteId: string, scheme: HarmonyScheme): void =>
  setState(paletteId, 'harmony', 'scheme', scheme);

export const setHarmonyAngle = (paletteId: string, angle: number): void =>
  setState(paletteId, 'harmony', 'angle', angle);

export const setSemanticScale = (paletteId: string, withScale: boolean): void =>
  setState(paletteId, 'semantic', 'withScale', withScale);

export const setApplied = (paletteId: string, signature: string | null): void => {
  if (state[paletteId] === undefined) return;
  setState(paletteId, 'applied', signature);
};
