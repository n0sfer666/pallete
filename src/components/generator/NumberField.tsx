import type { Component } from 'solid-js';
import styles from './fields.module.css';

interface NumberFieldProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onCommit: (value: number) => void;
}

export const NumberField: Component<NumberFieldProps> = (props) => (
  <label class={styles.field}>
    <span class={styles.fieldLabel}>{props.label}</span>
    <input
      type="number"
      value={props.value}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={(e) => props.onCommit(e.currentTarget.valueAsNumber)}
    />
  </label>
);
