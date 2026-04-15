import { createEffect, onCleanup } from 'solid-js';
import { projectState, markClean } from '~/store/project';
import { projectSave } from '~/ipc/commands';

const DEBOUNCE_MS = 600;

export const useAutoSave = (): void => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  createEffect(() => {
    const project = projectState.project;
    const path = projectState.path;
    const dirty = projectState.dirty;
    if (!project || !path || !dirty) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      void projectSave(project, path).then(() => {
        markClean();
      });
    }, DEBOUNCE_MS);
  });

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });
};
