import type { BuilderTerminal } from '@sittir/types';
import type { LetCondition, LetConditionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function letCondition(config: LetConditionConfig): LetCondition {
  return {
    kind: 'let_condition',
    ...config,
  } as LetCondition;
}

class LetConditionBuilder implements BuilderTerminal<LetCondition> {
  private _pattern: string = '';
  private _value: string = '';

  constructor(pattern: string) {
    this._pattern = pattern;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  build(): LetCondition {
    return letCondition({
      pattern: this._pattern,
      value: this._value,
    } as LetConditionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function let_condition(pattern: string): LetConditionBuilder {
  return new LetConditionBuilder(pattern);
}
