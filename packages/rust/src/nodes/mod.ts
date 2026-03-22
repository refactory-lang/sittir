import type { BuilderTerminal } from '@sittir/types';
import type { ModItem, ModItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function modItem(config: ModItemConfig): ModItem {
  return {
    kind: 'mod_item',
    ...config,
  } as ModItem;
}

class ModBuilder implements BuilderTerminal<ModItem> {
  private _body?: string;
  private _name: string = '';
  private _children?: string;

  constructor(name: string) {
    this._name = name;
  }

  body(value: string): this {
    this._body = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): ModItem {
    return modItem({
      body: this._body,
      name: this._name,
      children: this._children,
    } as ModItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function mod(name: string): ModBuilder {
  return new ModBuilder(name);
}
