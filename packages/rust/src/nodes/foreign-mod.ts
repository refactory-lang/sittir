import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, ExternModifier, ForeignModItem, VisibilityModifier } from '../types.js';


class ForeignModBuilder extends Builder<ForeignModItem> {
  private _body?: Builder;
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push(';');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForeignModItem {
    return {
      kind: 'foreign_mod_item',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ForeignModItem;
  }

  override get nodeKind(): string { return 'foreign_mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: ';', type: ';' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForeignModBuilder };

export function foreign_mod(...children: Builder[]): ForeignModBuilder {
  return new ForeignModBuilder(...children);
}

export interface ForeignModItemOptions {
  body?: Builder<DeclarationList>;
  children: Builder<ExternModifier | VisibilityModifier> | (Builder<ExternModifier | VisibilityModifier>)[];
}

export namespace foreign_mod {
  export function from(options: ForeignModItemOptions): ForeignModBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ForeignModBuilder(..._arr);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
