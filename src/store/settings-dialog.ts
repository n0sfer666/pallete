import { createSignal } from 'solid-js';

const [open, setOpen] = createSignal(false);

export const settingsOpen = open;
export const openSettings = (): void => {
  setOpen(true);
};
export const closeSettings = (): void => {
  setOpen(false);
};
