import { onCleanup, onMount } from 'solid-js';
import { openImport } from '~/store/import';

const ACCEPTED = /\.(txt|md|css|scss)$/i;

export const useFileDrop = (): void => {
  const onDragOver = (e: DragEvent): void => {
    e.preventDefault();
  };

  const onDrop = async (e: DragEvent): Promise<void> => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file || !ACCEPTED.test(file.name)) return;
    const text = await file.text();
    if (text.trim()) openImport(text);
  };

  onMount(() => {
    document.addEventListener('dragover', onDragOver);
    document.addEventListener('drop', onDrop);
  });
  onCleanup(() => {
    document.removeEventListener('dragover', onDragOver);
    document.removeEventListener('drop', onDrop);
  });
};
