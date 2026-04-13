import { createSignal } from 'solid-js';

export interface Command {
  label: string;
  apply: () => void;
  revert: () => void;
}

const MAX_STACK = 200;

const [undoStack, setUndoStack] = createSignal<Command[]>([]);
const [redoStack, setRedoStack] = createSignal<Command[]>([]);

export const canUndo = (): boolean => undoStack().length > 0;
export const canRedo = (): boolean => redoStack().length > 0;

export const run = (cmd: Command): void => {
  cmd.apply();
  setUndoStack((s) => {
    const next = [...s, cmd];
    return next.length > MAX_STACK ? next.slice(-MAX_STACK) : next;
  });
  setRedoStack([]);
};

export const undo = (): Command | null => {
  const stack = undoStack();
  const cmd = stack[stack.length - 1];
  if (!cmd) return null;
  cmd.revert();
  setUndoStack(stack.slice(0, -1));
  setRedoStack((s) => [...s, cmd]);
  return cmd;
};

export const redo = (): Command | null => {
  const stack = redoStack();
  const cmd = stack[stack.length - 1];
  if (!cmd) return null;
  cmd.apply();
  setRedoStack(stack.slice(0, -1));
  setUndoStack((s) => [...s, cmd]);
  return cmd;
};

export const clearHistory = (): void => {
  setUndoStack([]);
  setRedoStack([]);
};
