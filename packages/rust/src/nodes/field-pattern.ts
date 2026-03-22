import type { BuilderTerminal } from '@sittir/types';
import type { FieldPattern, FieldPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function fieldPattern(config: FieldPatternConfig): FieldPattern {
  return {
    kind: 'field_pattern',
    ...config,
  } as FieldPattern;
}

class FieldPatternBuilder implements BuilderTerminal<FieldPattern> {
  private _name: string = '';
  private _pattern?: string;
  private _children?: string;

  constructor(name: string) {
    this._name = name;
  }

  pattern(value: string): this {
    this._pattern = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): FieldPattern {
    return fieldPattern({
      name: this._name,
      pattern: this._pattern,
      children: this._children,
    } as FieldPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function field_pattern(name: string): FieldPatternBuilder {
  return new FieldPatternBuilder(name);
}
