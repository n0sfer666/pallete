import { Show, createSignal, type Component } from 'solid-js';
import { open } from '@tauri-apps/plugin-dialog';
import { createProject } from '~/store/workspace';
import { projectState } from '~/store/project';
import {
  newProjectOpen,
  closeNewProject,
  consumeNewProjectCallback,
} from '~/store/new-project-dialog';
import styles from './NewProjectDialog.module.css';

export const NewProjectDialog: Component = () => {
  const [name, setName] = createSignal('');
  const [dir, setDir] = createSignal<string | null>(null);
  const [error, setError] = createSignal<string | null>(null);
  const [busy, setBusy] = createSignal(false);

  const reset = (): void => {
    setName('');
    setDir(null);
    setError(null);
    setBusy(false);
  };

  const handleClose = (): void => {
    closeNewProject();
    reset();
  };

  const pickDir = async (): Promise<void> => {
    const selected = await open({ directory: true, multiple: false });
    if (typeof selected === 'string') setDir(selected);
  };

  const canSubmit = (): boolean => name().trim().length > 0 && dir() !== null && !busy();

  const submit = async (): Promise<void> => {
    const d = dir();
    const n = name().trim();
    if (!d || !n) return;
    setBusy(true);
    setError(null);
    try {
      await createProject(d, n);
      const cb = consumeNewProjectCallback();
      const created = projectState.project;
      handleClose();
      if (cb && created) cb(created);
    } catch (e) {
      setError(String(e));
      setBusy(false);
    }
  };

  return (
    <Show when={newProjectOpen()}>
      <div class={styles.backdrop} onClick={handleClose}>
        <div class={styles.modal} onClick={(e) => e.stopPropagation()}>
          <header class={styles.header}>
            <h2>Новый проект</h2>
            <button onClick={handleClose}>×</button>
          </header>
          <div class={styles.body}>
            <label class={styles.field}>
              <span>Название</span>
              <input
                type="text"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="Мой проект"
                autofocus
              />
            </label>
            <div class={styles.field}>
              <span>Папка</span>
              <div class={styles.dirRow}>
                <span>{dir() ?? '— не выбрана —'}</span>
                <button onClick={pickDir} disabled={busy()}>
                  Выбрать…
                </button>
              </div>
            </div>
            <Show when={error()}>
              <div class={styles.error}>{error()}</div>
            </Show>
          </div>
          <footer class={styles.footer}>
            <button onClick={handleClose} disabled={busy()}>
              Отмена
            </button>
            <button onClick={submit} disabled={!canSubmit()}>
              Создать
            </button>
          </footer>
        </div>
      </div>
    </Show>
  );
};
