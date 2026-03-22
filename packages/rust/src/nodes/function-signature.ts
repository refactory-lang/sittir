import type { BuilderTerminal } from '@sittir/types';
import type { FunctionSignatureItem, FunctionSignatureItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function functionSignatureItem(config: FunctionSignatureItemConfig): FunctionSignatureItem {
  return {
    kind: 'function_signature_item',
    ...config,
  } as FunctionSignatureItem;
}

class FunctionSignatureBuilder implements BuilderTerminal<FunctionSignatureItem> {
  private _name: string = '';
  private _parameters: string = '';
  private _returnType?: string;
  private _typeParameters?: string;
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  parameters(value: string): this {
    this._parameters = value;
    return this;
  }

  returnType(value: string): this {
    this._returnType = value;
    return this;
  }

  typeParameters(value: string): this {
    this._typeParameters = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): FunctionSignatureItem {
    return functionSignatureItem({
      name: this._name,
      parameters: this._parameters,
      returnType: this._returnType,
      typeParameters: this._typeParameters,
      children: this._children,
    } as FunctionSignatureItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function function_signature(name: string): FunctionSignatureBuilder {
  return new FunctionSignatureBuilder(name);
}
