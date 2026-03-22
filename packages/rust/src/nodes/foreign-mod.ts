import type { BuilderTerminal } from '@sittir/types';
import type { ForeignModItem, ForeignModItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function foreignModItem(config: ForeignModItemConfig): ForeignModItem {
  return {
    kind: 'foreign_mod_item',
    ...config,
  } as ForeignModItem;
}

class ForeignModBuilder implements BuilderTerminal<ForeignModItem> {
  private _body?: string;
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  body(value: string): this {
    this._body = value;
    return this;
  }

  build(): ForeignModItem {
    return foreignModItem({
      body: this._body,
      children: this._children,
    } as ForeignModItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function foreign_mod(children: string[]): ForeignModBuilder {
  return new ForeignModBuilder(children);
}
