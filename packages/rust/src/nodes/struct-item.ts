import type { BuilderTerminal } from '@sittir/types';
import type { StructItem, StructItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function structItem(config: StructItemConfig): StructItem {
  return {
    kind: 'struct_item',
    ...config,
  } as StructItem;
}

class StructBuilder implements BuilderTerminal<StructItem> {
  private _body?: string;
  private _name: string = '';
  private _typeParameters?: string;
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  body(value: string): this {
    this._body = value;
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

  build(): StructItem {
    return structItem({
      body: this._body,
      name: this._name,
      typeParameters: this._typeParameters,
      children: this._children,
    } as StructItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function struct_(name: string): StructBuilder {
  return new StructBuilder(name);
}
