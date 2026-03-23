import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, ExternModifier, ForeignModItem, VisibilityModifier } from '../types.js';


class ForeignModBuilder extends Builder<ForeignModItem> {
  private _body?: Builder<DeclarationList>;
  private _children: Builder<ExternModifier | VisibilityModifier>[] = [];

  constructor(...children: Builder<ExternModifier | VisibilityModifier>[]) {
    super();
    this._children = children;
  }

  body(value: Builder<DeclarationList>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForeignModItem {
    return {
      kind: 'foreign_mod_item',
      body: this._body?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ForeignModItem;
  }

  override get nodeKind(): string { return 'foreign_mod_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForeignModBuilder };

export function foreign_mod(...children: Builder<ExternModifier | VisibilityModifier>[]): ForeignModBuilder {
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
