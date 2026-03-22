import type { BuilderTerminal } from '@sittir/types';
import type { Arguments, ArgumentsConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createArguments(config: ArgumentsConfig): Arguments {
  return {
    kind: 'arguments',
    ...config,
  } as Arguments;
}

class ArgumentsBuilder implements BuilderTerminal<Arguments> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): Arguments {
    return createArguments({
      children: this._children,
    } as ArgumentsConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function arguments_(): ArgumentsBuilder {
  return new ArgumentsBuilder();
}
