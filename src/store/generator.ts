import { createStore, produce } from 'solid-js/store';
import type { GeneratorParams } from '~/lib/generate';
import type { ShadeParams } from '~/lib/generate/shade';
import type { GeneratorMode } from '~/lib/generate/types';

export interface GeneratorState extends GeneratorParams {
  applied: string | null;
}

const DEFAULT_BASE_HEX = '#3B82F6';

const defaultShade = (): ShadeParams => ({ from: 50, to: 900, step: 100, baseShade: 500 });

const defaultState = (): GeneratorState => ({
  applied: null,
  mode: 'shade',
  baseHex: DEFAULT_BASE_HEX,
  shade: defaultShade(),
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

export const setShadeParam = (
  paletteId: string,
  key: keyof ShadeParams,
  value: number,
): void => setState(paletteId, 'shade', key, value);

export const setApplied = (paletteId: string, signature: string): void => {
  if (state[paletteId] === undefined) return;
  setState(paletteId, 'applied', signature);
};
