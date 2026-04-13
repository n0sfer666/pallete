import type { Component } from 'solid-js';
import { ProjectsColumn } from '~/components/ProjectsColumn';
import { PalettesColumn } from '~/components/PalettesColumn';
import { PaletteDetails } from '~/components/PaletteDetails';
import styles from './Layout.module.css';

export const Layout: Component = () => {
  return (
    <div class={styles.layout}>
      <ProjectsColumn />
      <PalettesColumn />
      <PaletteDetails />
    </div>
  );
};

export { styles as layoutStyles };
