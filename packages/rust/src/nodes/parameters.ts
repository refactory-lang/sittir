import type { BuilderTerminal } from '@sittir/types';
import type { Parameters, ParametersConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

function createParameters(config: ParametersConfig): Parameters {
  return {
    kind: 'parameters',
    ...config,
  } as Parameters;
}

class ParametersBuilder implements BuilderTerminal<Parameters> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): Parameters {
    return createParameters({
      children: this._children,
    } as ParametersConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function parameters(): ParametersBuilder {
  return new ParametersBuilder();
}
