import { describe, it, expect } from 'vitest';
import { formatColor, toHexString, toRgbString } from '~/lib/color/format';

describe('toHexString', () => {
  it('drops the alpha byte when opaque', () => {
    expect(toHexString('#3B82F6', 1)).toBe('#3B82F6');
  });

  it('appends the alpha byte when translucent', () => {
    expect(toHexString('#3B82F6', 0.5)).toBe('#3B82F680');
  });

  it('falls back to the raw value when it cannot be parsed', () => {
    expect(toHexString('broken', 0.5)).toBe('broken');
  });
});

describe('formatColor', () => {
  it('copies hex verbatim', () => {
    expect(formatColor('#3B82F6', 1, 'hex')).toBe('#3B82F6');
    expect(formatColor('#3B82F6', 0.5, 'hex')).toBe('#3B82F6');
  });

  it('renders rgb and rgba', () => {
    expect(formatColor('#3B82F6', 1, 'rgb')).toBe('rgb(59, 130, 246)');
    expect(formatColor('#3B82F6', 0.5, 'rgb')).toBe('rgba(59, 130, 246, 0.5)');
    expect(toRgbString('#000000', 1)).toBe('rgb(0, 0, 0)');
  });

  it('renders hsl and hsla', () => {
    expect(formatColor('#FF0000', 1, 'hsl')).toBe('hsl(0, 100%, 50%)');
    expect(formatColor('#00FF00', 1, 'hsl')).toBe('hsl(120, 100%, 50%)');
    expect(formatColor('#0000FF', 0.25, 'hsl')).toBe('hsla(240, 100%, 50%, 0.25)');
    expect(formatColor('#3B82F6', 1, 'hsl')).toBe('hsl(217, 91%, 60%)');
  });

  it('reports greys with zero saturation', () => {
    expect(formatColor('#7F7F7F', 1, 'hsl')).toBe('hsl(0, 0%, 50%)');
    expect(formatColor('#FFFFFF', 1, 'hsl')).toBe('hsl(0, 0%, 100%)');
  });

  it('falls back to the raw value when it cannot be parsed', () => {
    expect(formatColor('broken', 1, 'rgb')).toBe('broken');
    expect(formatColor('broken', 1, 'hsl')).toBe('broken');
  });
});
