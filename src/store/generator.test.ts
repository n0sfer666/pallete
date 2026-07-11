import { describe, it, expect, beforeEach } from 'vitest';
import type { Project } from '~/ipc/types';
import { projectState, setProject, addPalette, removePalette } from '~/store/project';
import { clearHistory, undo } from '~/store/undo';
import {
  generatorFor,
  isGeneratorEnabled,
  enableGenerator,
  disableGenerator,
  setApplied,
  setShadeParam,
} from '~/store/generator';

const makeProject = (id: string): Project => ({
  version: 1,
  id,
  name: 'Test',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  palettes: [],
});

describe('generator store', () => {
  beforeEach(() => {
    clearHistory();
    setProject(makeProject('p-1'), '/tmp/a.palette.json');
  });

  it('enables with shade defaults', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    expect(isGeneratorEnabled(p.id)).toBe(true);
    expect(generatorFor(p.id)?.mode).toBe('shade');
    expect(generatorFor(p.id)?.shade).toEqual({ from: 50, to: 900, step: 100, baseShade: 500 });
  });

  it('disables by dropping the entry', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    disableGenerator(p.id);
    expect(isGeneratorEnabled(p.id)).toBe(false);
    expect(generatorFor(p.id)).toBeUndefined();
  });

  it('drops generator state when its palette is removed', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    removePalette(p.id);
    expect(isGeneratorEnabled(p.id)).toBe(false);
  });

  it('keeps the generator off after undoing the palette removal', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    removePalette(p.id);
    undo();
    expect(projectState.project?.palettes[0]?.id).toBe(p.id);
    expect(isGeneratorEnabled(p.id)).toBe(false);
  });

  it('clears every generator when another project is opened', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    setProject(makeProject('p-2'), '/tmp/b.palette.json');
    expect(isGeneratorEnabled(p.id)).toBe(false);
  });

  it('resets the applied signature when a param changes', () => {
    const p = addPalette('Gen');
    enableGenerator(p.id);
    setApplied(p.id, 'sig-1');
    expect(generatorFor(p.id)?.applied).toBe('sig-1');
    setShadeParam(p.id, 'step', 50);
    expect(generatorFor(p.id)?.shade.step).toBe(50);
  });

  it('ignores an applied signature for an unknown palette', () => {
    setApplied('missing', 'sig');
    expect(generatorFor('missing')).toBeUndefined();
  });
});
