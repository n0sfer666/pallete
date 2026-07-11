import { fail, MAX_GENERATED, ok, tooManyColors, type Result } from '~/lib/generate/types';

export type StepsResult = Result<number[]>;

export const SHADE_MAX = 1000;
export const ALPHA_MAX = 100;

const isCount = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;

const countInterior = (lo: number, hi: number, step: number): number => {
  const first = (Math.floor(lo / step) + 1) * step;
  const last = hi % step === 0 ? hi - step : Math.floor(hi / step) * step;
  return last < first ? 0 : (last - first) / step + 1;
};

export const buildSteps = (from: number, to: number, step: number, max: number): StepsResult => {
  if (!isCount(from) || !isCount(to)) {
    return fail('Границы должны быть целыми числами не меньше нуля');
  }
  if (!Number.isSafeInteger(step) || step <= 0) {
    return fail('Шаг должен быть целым числом больше нуля');
  }
  if (from === to) {
    return fail('Начало и конец диапазона совпадают');
  }

  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  if (hi > max) {
    return fail(`Границы не должны превышать ${max}`);
  }

  const total = 2 + countInterior(lo, hi, step);
  if (total > MAX_GENERATED) {
    return fail(tooManyColors(total));
  }

  const steps = [lo];
  for (let value = (Math.floor(lo / step) + 1) * step; value < hi; value += step) {
    steps.push(value);
  }
  steps.push(hi);
  return ok(steps);
};
