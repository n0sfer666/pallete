import { createSignal } from 'solid-js';
import type { Project } from '~/ipc/types';

type OnCreated = (project: Project) => void;

const [open, setOpen] = createSignal(false);
let onCreated: OnCreated | null = null;

export const newProjectOpen = open;

export const openNewProject = (cb?: OnCreated): void => {
  onCreated = cb ?? null;
  setOpen(true);
};

export const closeNewProject = (): void => {
  setOpen(false);
  onCreated = null;
};

export const consumeNewProjectCallback = (): OnCreated | null => {
  const cb = onCreated;
  onCreated = null;
  return cb;
};
