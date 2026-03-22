import type { BuilderTerminal } from '@sittir/types';
import type { VariadicParameter, VariadicParameterConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function variadicParameter(config: VariadicParameterConfig): VariadicParameter {
  return {
    kind: 'variadic_parameter',
    ...config,
  } as VariadicParameter;
}

class VariadicParameterBuilder implements BuilderTerminal<VariadicParameter> {
  private _pattern?: string;
  private _children?: string;

  constructor() {}

  pattern(value: string): this {
    this._pattern = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): VariadicParameter {
    return variadicParameter({
      pattern: this._pattern,
      children: this._children,
    } as VariadicParameterConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function variadic_parameter(): VariadicParameterBuilder {
  return new VariadicParameterBuilder();
}
