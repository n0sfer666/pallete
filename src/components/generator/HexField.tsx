import type { Component } from 'solid-js';
import styles from './fields.module.css';

interface HexFieldProps {
  label: string;
  value: string;
  onCommit: (value: string) => void;
}

export const HexField: Component<HexFieldProps> = (props) => {
  const commit = (input: HTMLInputElement): void => {
    props.onCommit(input.value.trim().toUpperCase());
    input.value = props.value;
  };

  return (
    <label class={styles.field}>
      <span class={styles.fieldLabel}>{props.label}</span>
      <input
        type="text"
        spellcheck={false}
        value={props.value}
        onChange={(e) => commit(e.currentTarget)}
      />
    </label>
  );
};
