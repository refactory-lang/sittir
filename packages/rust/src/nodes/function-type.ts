import type { BuilderTerminal } from '@sittir/types';
import type { FunctionType, FunctionTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function functionType(config: FunctionTypeConfig): FunctionType {
  return {
    kind: 'function_type',
    ...config,
  } as FunctionType;
}

class FunctionTypeBuilder implements BuilderTerminal<FunctionType> {
  private _parameters: string = '';
  private _returnType?: string;
  private _trait?: string;
  private _children: string[] = [];

  constructor(parameters: string) {
    this._parameters = parameters;
  }

  returnType(value: string): this {
    this._returnType = value;
    return this;
  }

  trait(value: string): this {
    this._trait = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FunctionType {
    return functionType({
      parameters: this._parameters,
      returnType: this._returnType,
      trait: this._trait,
      children: this._children,
    } as FunctionTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function function_type(parameters: string): FunctionTypeBuilder {
  return new FunctionTypeBuilder(parameters);
}
