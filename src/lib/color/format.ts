import { parseHex, withAlpha } from '~/lib/color/hex';
import type { Rgb } from '~/lib/color/types';

export type ColorFormat = 'hex' | 'rgb' | 'hsl';

const hueOf = ({ r, g, b }: Rgb, max: number, delta: number): number => {
  if (max === r) return (g - b) / delta + (g < b ? 6 : 0);
  if (max === g) return (b - r) / delta + 2;
  return (r - g) / delta + 4;
};

const toRgbCss = ({ r, g, b }: Rgb, alpha: number): string => {
  const channels = [r, g, b].map((channel) => Math.round(channel * 255)).join(', ');
  return alpha < 1 ? `rgba(${channels}, ${alpha})` : `rgb(${channels})`;
};

const toHslCss = ({ r, g, b }: Rgb, alpha: number): string => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (l > 0.5 ? 2 - max - min : max + min);
  const h = delta === 0 ? 0 : hueOf({ r, g, b }, max, delta) * 60;
  const parts = `${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%`;
  return alpha < 1 ? `hsla(${parts}, ${alpha})` : `hsl(${parts})`;
};

export const toHexString = (hex: string, alpha: number): string => withAlpha(hex, alpha) ?? hex;

export const formatColor = (hex: string, alpha: number, format: ColorFormat): string => {
  if (format === 'hex') return hex;
  const parsed = parseHex(hex);
  if (!parsed) return hex;
  return format === 'rgb' ? toRgbCss(parsed.rgb, alpha) : toHslCss(parsed.rgb, alpha);
};

export const toRgbString = (hex: string, alpha: number): string => formatColor(hex, alpha, 'rgb');
