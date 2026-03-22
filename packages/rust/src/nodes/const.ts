import type { BuilderTerminal } from '@sittir/types';
import type { ConstItem, ConstItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function constItem(config: ConstItemConfig): ConstItem {
  return {
    kind: 'const_item',
    ...config,
  } as ConstItem;
}

class ConstBuilder implements BuilderTerminal<ConstItem> {
  private _name: string = '';
  private _type: string = '';
  private _value?: string;
  private _children?: string;

  constructor(name: string) {
    this._name = name;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ConstItem {
    return constItem({
      name: this._name,
      type: this._type,
      value: this._value,
      children: this._children,
    } as ConstItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function const_(name: string): ConstBuilder {
  return new ConstBuilder(name);
}
