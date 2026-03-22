import type { BuilderTerminal } from '@sittir/types';
import type { StaticItem, StaticItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function staticItem(config: StaticItemConfig): StaticItem {
  return {
    kind: 'static_item',
    ...config,
  } as StaticItem;
}

class StaticBuilder implements BuilderTerminal<StaticItem> {
  private _name: string = '';
  private _type: string = '';
  private _value?: string;
  private _children: string[] = [];

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

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): StaticItem {
    return staticItem({
      name: this._name,
      type: this._type,
      value: this._value,
      children: this._children,
    } as StaticItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function static_(name: string): StaticBuilder {
  return new StaticBuilder(name);
}
