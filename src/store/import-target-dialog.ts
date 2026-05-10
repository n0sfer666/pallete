import { createSignal } from 'solid-js';
import type { DuplicateStrategy } from '~/store/import';

const [open, setOpen] = createSignal(false);
let strategy: DuplicateStrategy = 'merge';

export const importTargetOpen = open;

export const openImportTarget = (s: DuplicateStrategy): void => {
  strategy = s;
  setOpen(true);
};

export const closeImportTarget = (): void => {
  setOpen(false);
};

export const importTargetStrategy = (): DuplicateStrategy => strategy;
