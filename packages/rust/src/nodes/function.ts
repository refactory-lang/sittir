import type { BuilderTerminal } from '@sittir/types';
import type { FunctionItem, FunctionItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function functionItem(config: FunctionItemConfig): FunctionItem {
  return {
    kind: 'function_item',
    ...config,
  } as FunctionItem;
}

class FunctionBuilder implements BuilderTerminal<FunctionItem> {
  private _body: string = '';
  private _name: string = '';
  private _parameters: string = '';
  private _returnType?: string;
  private _typeParameters?: string;
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  body(value: string): this {
    this._body = value;
    return this;
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

  build(): FunctionItem {
    return functionItem({
      body: this._body,
      name: this._name,
      parameters: this._parameters,
      returnType: this._returnType,
      typeParameters: this._typeParameters,
      children: this._children,
    } as FunctionItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function fn(name: string): FunctionBuilder {
  return new FunctionBuilder(name);
}
