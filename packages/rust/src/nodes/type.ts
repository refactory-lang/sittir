import type { BuilderTerminal } from '@sittir/types';
import type { TypeItem, TypeItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function typeItem(config: TypeItemConfig): TypeItem {
  return {
    kind: 'type_item',
    ...config,
  } as TypeItem;
}

class TypeBuilder implements BuilderTerminal<TypeItem> {
  private _name: string = '';
  private _type: string = '';
  private _typeParameters?: string;
  private _children: string[] = [];

  constructor(name: string) {
    this._name = name;
  }

  type(value: string): this {
    this._type = value;
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

  build(): TypeItem {
    return typeItem({
      name: this._name,
      type: this._type,
      typeParameters: this._typeParameters,
      children: this._children,
    } as TypeItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function type_(name: string): TypeBuilder {
  return new TypeBuilder(name);
}
