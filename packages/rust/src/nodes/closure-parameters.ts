import type { BuilderTerminal } from '@sittir/types';
import type { ClosureParameters, ClosureParametersConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function closureParameters(config: ClosureParametersConfig): ClosureParameters {
  return {
    kind: 'closure_parameters',
    ...config,
  } as ClosureParameters;
}

class ClosureParametersBuilder implements BuilderTerminal<ClosureParameters> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): ClosureParameters {
    return closureParameters({
      children: this._children,
    } as ClosureParametersConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function closure_parameters(): ClosureParametersBuilder {
  return new ClosureParametersBuilder();
}
