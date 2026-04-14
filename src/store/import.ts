import { createStore } from 'solid-js/store';
import type { ParsedPalette, ParseOptionsDto, ParseResult } from '~/ipc/types';
import { parseText } from '~/ipc/commands';
import { run } from '~/store/undo';
import { projectState } from '~/store/project';
import { setProject } from '~/store/project';
import { workspaceState } from '~/store/workspace';
import { uuid } from '~/lib/uuid';

export type DuplicateStrategy = 'merge' | 'replace' | 'skip';

interface ImportState {
  open: boolean;
  text: string;
  options: ParseOptionsDto;
  result: ParseResult | null;
  error: string | null;
  parsing: boolean;
}

const [state, setState] = createStore<ImportState>({
  open: false,
  text: '',
  options: {},
  result: null,
  error: null,
  parsing: false,
});

export { state as importState };

export const openImport = (initialText: string): void => {
  const defaults: ParseOptionsDto = {
    acceptHexWithoutHash: workspaceState.workspace?.settings.acceptHexWithoutHash ?? false,
  };
  setState({ open: true, text: initialText, options: defaults, result: null, error: null });
  void reparse();
};

export const closeImport = (): void => {
  setState({ open: false, text: '', result: null, error: null });
};

export const setText = (text: string): void => {
  setState({ text });
  void reparse();
};

export const setOptions = (patch: Partial<ParseOptionsDto>): void => {
  setState('options', (o) => ({ ...o, ...patch }));
  void reparse();
};

let reparseToken = 0;

const reparse = async (): Promise<void> => {
  const token = ++reparseToken;
  setState({ parsing: true });
  try {
    const result = await parseText(state.text, state.options);
    if (token !== reparseToken) return;
    setState({ result, error: null, parsing: false });
  } catch (e) {
    if (token !== reparseToken) return;
    setState({ result: null, error: String(e), parsing: false });
  }
};

export const totalImportColors = (): number =>
  state.result?.palettes.reduce((acc, p) => acc + p.colors.length, 0) ?? 0;

export const findConflicts = (): ParsedPalette[] => {
  const project = projectState.project;
  if (!project || !state.result) return [];
  const existing = new Set(project.palettes.map((p) => p.name.toLowerCase()));
  return state.result.palettes.filter((p) => existing.has(p.name.toLowerCase()));
};

export const applyImport = (strategy: DuplicateStrategy): void => {
  const project = projectState.project;
  const result = state.result;
  if (!project || !result) return;

  const snapshot = JSON.parse(JSON.stringify(project));
  const next = JSON.parse(JSON.stringify(project));

  for (const incoming of result.palettes) {
    const lower = incoming.name.toLowerCase();
    const existingIdx = next.palettes.findIndex(
      (p: { name: string }) => p.name.toLowerCase() === lower,
    );

    if (existingIdx < 0) {
      next.palettes.push(parsedToPalette(incoming));
      continue;
    }

    if (strategy === 'skip') continue;
    if (strategy === 'replace') {
      next.palettes[existingIdx] = parsedToPalette(incoming);
      continue;
    }
    next.palettes[existingIdx].colors.push(...parsedToPalette(incoming).colors);
  }

  run({
    label: 'import palettes',
    apply: () => setProject(next, projectState.path),
    revert: () => setProject(snapshot, projectState.path),
  });

  closeImport();
};

const parsedToPalette = (p: ParsedPalette) => ({
  id: uuid(),
  name: p.name,
  tags: [] as string[],
  colors: p.colors.map((c) => ({
    id: uuid(),
    hex: c.hex,
    alpha: c.alpha,
    name: c.name ?? undefined,
  })),
});
