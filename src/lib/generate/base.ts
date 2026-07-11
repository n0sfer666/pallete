import { formatHex, parseHex } from '~/lib/color/hex';
import { oklabToOklch, rgbToOklab } from '~/lib/color/oklch';
import type { Oklch } from '~/lib/color/types';

export interface ParsedBase {
  hex: string;
  oklch: Oklch;
}

export const parseBase = (input: string): ParsedBase | null => {
  const parsed = parseHex(input);
  if (parsed === null) return null;
  const hex = formatHex(parsed.rgb);
  return hex === null ? null : { hex, oklch: oklabToOklch(rgbToOklab(parsed.rgb)) };
};
