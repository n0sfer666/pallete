import type { Rgb } from '~/lib/color/types';

export interface ParsedHex {
  rgb: Rgb;
  alpha: number | null;
}

const HEX_RE = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const expandShorthand = (digits: string): string =>
  digits.length > 4 ? digits : [...digits].map((digit) => `${digit}${digit}`).join('');

const toByte = (value: number): string | null => {
  if (!Number.isFinite(value)) return null;
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
};

export const parseHex = (input: string): ParsedHex | null => {
  const match = HEX_RE.exec(input.trim());
  if (!match) return null;
  const digits = expandShorthand(match[1]);
  const rgb = Number.parseInt(digits.slice(0, 6), 16);
  return {
    rgb: {
      r: ((rgb >> 16) & 0xff) / 255,
      g: ((rgb >> 8) & 0xff) / 255,
      b: (rgb & 0xff) / 255,
    },
    alpha: digits.length === 8 ? Number.parseInt(digits.slice(6, 8), 16) / 255 : null,
  };
};

export const formatHex = ({ r, g, b }: Rgb): string | null => {
  const red = toByte(r);
  const green = toByte(g);
  const blue = toByte(b);
  if (red === null || green === null || blue === null) return null;
  return `#${red}${green}${blue}`;
};

export const withAlpha = (hex: string, alpha: number): string | null => {
  const parsed = parseHex(hex);
  if (parsed === null) return null;
  const base = formatHex(parsed.rgb);
  if (base === null || alpha >= 1) return base;
  const byte = toByte(alpha);
  return byte === null ? null : `${base}${byte}`;
};
