import type { BuilderTerminal } from '@sittir/types';
import type { FunctionModifiers, FunctionModifiersConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function functionModifiers(config: FunctionModifiersConfig): FunctionModifiers {
  return {
    kind: 'function_modifiers',
    ...config,
  } as FunctionModifiers;
}

class FunctionModifiersBuilder implements BuilderTerminal<FunctionModifiers> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FunctionModifiers {
    return functionModifiers({
      children: this._children,
    } as FunctionModifiersConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function function_modifiers(): FunctionModifiersBuilder {
  return new FunctionModifiersBuilder();
}
