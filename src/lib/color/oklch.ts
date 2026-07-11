import { formatHex, parseHex } from '~/lib/color/hex';
import type { Oklab, Oklch, Rgb } from '~/lib/color/types';

const GAMUT_EPSILON = 0.5 / 255;
const ACHROMATIC_EPSILON = 1e-6;
const CHROMA_CEILING = 0.4;
const BISECTION_STEPS = 24;

const toLinear = (channel: number): number =>
  channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

const fromLinear = (channel: number): number =>
  channel <= 0.0031308 ? channel * 12.92 : 1.055 * channel ** (1 / 2.4) - 0.055;

const linearRgbToOklab = ({ r, g, b }: Rgb): Oklab => {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
};

const oklabToLinearRgb = ({ l, a, b }: Oklab): Rgb => {
  const lc = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const mc = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const sc = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return {
    r: 4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    g: -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    b: -0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc,
  };
};

const isRenderable = (channel: number): boolean =>
  channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON;

export const rgbToOklab = (rgb: Rgb): Oklab =>
  linearRgbToOklab({ r: toLinear(rgb.r), g: toLinear(rgb.g), b: toLinear(rgb.b) });

export const oklabToRgb = (lab: Oklab): Rgb => {
  const linear = oklabToLinearRgb(lab);
  return { r: fromLinear(linear.r), g: fromLinear(linear.g), b: fromLinear(linear.b) };
};

export const isInSrgbGamut = (lab: Oklab): boolean => {
  const { r, g, b } = oklabToRgb(lab);
  return isRenderable(r) && isRenderable(g) && isRenderable(b);
};

export const oklchToOklab = ({ l, c, h }: Oklch): Oklab => {
  const radians = (h * Math.PI) / 180;
  return { l, a: c * Math.cos(radians), b: c * Math.sin(radians) };
};

export const oklabToOklch = ({ l, a, b }: Oklab): Oklch => {
  const c = Math.hypot(a, b);
  const h = c < ACHROMATIC_EPSILON ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
};

export const normalizeHue = (h: number): number =>
  h >= 0 && h < 360 ? h : ((h % 360) + 360) % 360;

const isFinite3 = ({ l, c, h }: Oklch): boolean =>
  Number.isFinite(l) && Number.isFinite(c) && Number.isFinite(h);

export const clampChromaToGamut = (color: Oklch): Oklch => {
  if (!isFinite3(color)) return color;
  const l = Math.min(1, Math.max(0, color.l));
  const h = normalizeHue(color.h);
  if (l <= 0 || l >= 1) return { l, c: 0, h };

  const c = Math.max(0, color.c);
  if (isInSrgbGamut(oklchToOklab({ l, c, h }))) return { l, c, h };

  let reachable = 0;
  let unreachable = Math.min(c, CHROMA_CEILING);
  for (let step = 0; step < BISECTION_STEPS; step += 1) {
    const mid = (reachable + unreachable) / 2;
    if (isInSrgbGamut(oklchToOklab({ l, c: mid, h }))) reachable = mid;
    else unreachable = mid;
  }
  return { l, c: reachable, h };
};

export const maxChromaFor = (l: number, h: number): number =>
  clampChromaToGamut({ l, c: CHROMA_CEILING, h }).c;

export const hexToOklab = (hex: string): Oklab | null => {
  const parsed = parseHex(hex);
  return parsed === null ? null : rgbToOklab(parsed.rgb);
};

export const oklabToHex = (lab: Oklab): string | null => formatHex(oklabToRgb(lab));

export const hexToOklch = (hex: string): Oklch | null => {
  const lab = hexToOklab(hex);
  return lab === null ? null : oklabToOklch(lab);
};

export const oklchToHex = (color: Oklch): string | null =>
  oklabToHex(oklchToOklab(clampChromaToGamut(color)));
