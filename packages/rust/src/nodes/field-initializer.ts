import type { BuilderTerminal } from '@sittir/types';
import type { FieldInitializer, FieldInitializerConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldInitializer(config: FieldInitializerConfig): FieldInitializer {
  return {
    kind: 'field_initializer',
    ...config,
  } as FieldInitializer;
}

class FieldInitializerBuilder implements BuilderTerminal<FieldInitializer> {
  private _field: string = '';
  private _value: string = '';
  private _children: string[] = [];

  constructor(field: string) {
    this._field = field;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FieldInitializer {
    return fieldInitializer({
      field: this._field,
      value: this._value,
      children: this._children,
    } as FieldInitializerConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field_initializer(field: string): FieldInitializerBuilder {
  return new FieldInitializerBuilder(field);
}
