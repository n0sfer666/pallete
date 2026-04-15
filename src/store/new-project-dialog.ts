import { createSignal } from 'solid-js';

const [open, setOpen] = createSignal(false);

export const newProjectOpen = open;
export const openNewProject = (): void => {
  setOpen(true);
};
export const closeNewProject = (): void => {
  setOpen(false);
};
