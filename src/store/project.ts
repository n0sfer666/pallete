import { createStore, produce } from 'solid-js/store';
import type { Color, Palette, Project } from '~/ipc/types';
import { uuid } from '~/lib/uuid';
import { run } from '~/store/undo';

interface ProjectState {
  project: Project | null;
  path: string | null;
  dirty: boolean;
}

const [state, setState] = createStore<ProjectState>({ project: null, path: null, dirty: false });

export { state as projectState };

export const setProject = (project: Project | null, path: string | null): void => {
  setState({ project, path, dirty: false });
};

export const markClean = (): void => setState('dirty', false);

const mutate = (fn: (p: Project) => void): void => {
  setState('project', produce((p) => {
    if (p) fn(p);
  }));
  setState('dirty', true);
};

export const addPalette = (name: string): Palette => {
  const palette: Palette = { id: uuid(), name, tags: [], colors: [] };
  run({
    label: 'add palette',
    apply: () => mutate((p) => { p.palettes.push(palette); }),
    revert: () => mutate((p) => { p.palettes = p.palettes.filter((x) => x.id !== palette.id); }),
  });
  return palette;
};

export const removePalette = (id: string): void => {
  const p = state.project;
  if (!p) return;
  const idx = p.palettes.findIndex((x) => x.id === id);
  if (idx < 0) return;
  const palette = p.palettes[idx];
  if (!palette) return;
  const snapshot: Palette = JSON.parse(JSON.stringify(palette));
  run({
    label: 'remove palette',
    apply: () => mutate((pr) => { pr.palettes.splice(idx, 1); }),
    revert: () => mutate((pr) => { pr.palettes.splice(idx, 0, snapshot); }),
  });
};

export const renamePalette = (id: string, name: string): void => {
  const p = state.project;
  const palette = p?.palettes.find((x) => x.id === id);
  if (!palette) return;
  const prev = palette.name;
  if (prev === name || name.trim() === '') return;
  run({
    label: 'rename palette',
    apply: () => mutate((pr) => {
      const t = pr.palettes.find((x) => x.id === id);
      if (t) t.name = name;
    }),
    revert: () => mutate((pr) => {
      const t = pr.palettes.find((x) => x.id === id);
      if (t) t.name = prev;
    }),
  });
};

export const duplicatePalette = (id: string): Palette | null => {
  const p = state.project;
  const palette = p?.palettes.find((x) => x.id === id);
  if (!palette) return null;
  const copy: Palette = {
    ...JSON.parse(JSON.stringify(palette)),
    id: uuid(),
    name: `${palette.name} copy`,
    colors: palette.colors.map((c) => ({ ...c, id: uuid() })),
  };
  run({
    label: 'duplicate palette',
    apply: () => mutate((pr) => { pr.palettes.push(copy); }),
    revert: () => mutate((pr) => { pr.palettes = pr.palettes.filter((x) => x.id !== copy.id); }),
  });
  return copy;
};

export const addColor = (paletteId: string, color: Omit<Color, 'id'>): Color => {
  const created: Color = { ...color, id: uuid() };
  run({
    label: 'add color',
    apply: () => mutate((pr) => {
      const pal = pr.palettes.find((x) => x.id === paletteId);
      if (pal) pal.colors.push(created);
    }),
    revert: () => mutate((pr) => {
      const pal = pr.palettes.find((x) => x.id === paletteId);
      if (pal) pal.colors = pal.colors.filter((c) => c.id !== created.id);
    }),
  });
  return created;
};

export const removeColor = (paletteId: string, colorId: string): void => {
  const pal = state.project?.palettes.find((x) => x.id === paletteId);
  if (!pal) return;
  const idx = pal.colors.findIndex((c) => c.id === colorId);
  if (idx < 0) return;
  const snapshot = pal.colors[idx];
  if (!snapshot) return;
  const snap: Color = { ...snapshot };
  run({
    label: 'remove color',
    apply: () => mutate((pr) => {
      const p = pr.palettes.find((x) => x.id === paletteId);
      if (p) p.colors.splice(idx, 1);
    }),
    revert: () => mutate((pr) => {
      const p = pr.palettes.find((x) => x.id === paletteId);
      if (p) p.colors.splice(idx, 0, snap);
    }),
  });
};

export const renameProject = (name: string): void => {
  const p = state.project;
  if (!p || p.name === name || name.trim() === '') return;
  const prev = p.name;
  run({
    label: 'rename project',
    apply: () => mutate((pr) => { pr.name = name; }),
    revert: () => mutate((pr) => { pr.name = prev; }),
  });
};
