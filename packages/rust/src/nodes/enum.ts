import type { BuilderTerminal } from '@sittir/types';
import type { EnumItem, EnumItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function enumItem(config: EnumItemConfig): EnumItem {
  return {
    kind: 'enum_item',
    ...config,
  } as EnumItem;
}

class EnumBuilder implements BuilderTerminal<EnumItem> {
  private _body: string = '';
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

  build(): EnumItem {
    return enumItem({
      body: this._body,
      name: this._name,
      typeParameters: this._typeParameters,
      children: this._children,
    } as EnumItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function enum_(name: string): EnumBuilder {
  return new EnumBuilder(name);
}
