import type { BuilderTerminal } from '@sittir/types';
import type { UnionItem, UnionItemConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function unionItem(config: UnionItemConfig): UnionItem {
  return {
    kind: 'union_item',
    ...config,
  } as UnionItem;
}

class UnionBuilder implements BuilderTerminal<UnionItem> {
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

  build(): UnionItem {
    return unionItem({
      body: this._body,
      name: this._name,
      typeParameters: this._typeParameters,
      children: this._children,
    } as UnionItemConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function union(name: string): UnionBuilder {
  return new UnionBuilder(name);
}
