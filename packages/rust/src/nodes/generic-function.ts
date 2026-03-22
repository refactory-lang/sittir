import type { BuilderTerminal } from '@sittir/types';
import type { GenericFunction, GenericFunctionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function genericFunction(config: GenericFunctionConfig): GenericFunction {
  return {
    kind: 'generic_function',
    ...config,
  } as GenericFunction;
}

class GenericFunctionBuilder implements BuilderTerminal<GenericFunction> {
  private _function: string = '';
  private _typeArguments: string = '';

  constructor(function_: string) {
    this._function = function_;
  }

  typeArguments(value: string): this {
    this._typeArguments = value;
    return this;
  }

  build(): GenericFunction {
    return genericFunction({
      function: this._function,
      typeArguments: this._typeArguments,
    } as GenericFunctionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function generic_function(function_: string): GenericFunctionBuilder {
  return new GenericFunctionBuilder(function_);
}
