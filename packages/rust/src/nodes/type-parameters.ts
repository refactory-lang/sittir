import type { BuilderTerminal } from '@sittir/types';
import type { TypeParameters, TypeParametersConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function typeParameters(config: TypeParametersConfig): TypeParameters {
  return {
    kind: 'type_parameters',
    ...config,
  } as TypeParameters;
}

class TypeParametersBuilder implements BuilderTerminal<TypeParameters> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): TypeParameters {
    return typeParameters({
      children: this._children,
    } as TypeParametersConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function type_parameters(children: string[]): TypeParametersBuilder {
  return new TypeParametersBuilder(children);
}
