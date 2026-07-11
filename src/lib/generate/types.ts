export type GeneratorMode = 'shade' | 'tonal' | 'interpolate' | 'alpha' | 'harmony' | 'semantic';

export interface GeneratedColor {
  hex: string;
  alpha: number;
  name: string;
}

export type Result<TValue> = { ok: true; value: TValue } | { ok: false; error: string };

export type GenResult = Result<GeneratedColor[]>;

export const MAX_GENERATED = 64;

export const ok = <TValue>(value: TValue): Result<TValue> => ({ ok: true, value });

export const fail = <TValue>(error: string): Result<TValue> => ({ ok: false, error });

export const tooManyColors = (count: number): string =>
  `Слишком много цветов: ${count}. Максимум ${MAX_GENERATED}`;

export const genOk = (colors: GeneratedColor[]): GenResult =>
  colors.length > MAX_GENERATED ? fail(tooManyColors(colors.length)) : ok(colors);
