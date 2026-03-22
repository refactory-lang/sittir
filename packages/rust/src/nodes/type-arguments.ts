import type { BuilderTerminal } from '@sittir/types';
import type { TypeArguments, TypeArgumentsConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function typeArguments(config: TypeArgumentsConfig): TypeArguments {
  return {
    kind: 'type_arguments',
    ...config,
  } as TypeArguments;
}

class TypeArgumentsBuilder implements BuilderTerminal<TypeArguments> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): TypeArguments {
    return typeArguments({
      children: this._children,
    } as TypeArgumentsConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function type_arguments(children: string[]): TypeArgumentsBuilder {
  return new TypeArgumentsBuilder(children);
}
