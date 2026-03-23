import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, Expression, Identifier, ListSplat, Subscript } from '../types.js';


class ListSplatBuilder extends Builder<ListSplat> {
  private _children: Builder<Attribute | Expression | Identifier | Subscript>[] = [];

  constructor(children: Builder<Attribute | Expression | Identifier | Subscript>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ListSplat {
    return {
      kind: 'list_splat',
      children: this._children[0]?.build(ctx),
    } as ListSplat;
  }

  override get nodeKind(): string { return 'list_splat'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ListSplatBuilder };

export function list_splat(children: Builder<Attribute | Expression | Identifier | Subscript>): ListSplatBuilder {
  return new ListSplatBuilder(children);
}

export interface ListSplatOptions {
  children: Builder<Attribute | Expression | Identifier | Subscript> | (Builder<Attribute | Expression | Identifier | Subscript>)[];
}

export namespace list_splat {
  export function from(options: ListSplatOptions): ListSplatBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ListSplatBuilder(_ctor);
    return b;
  }
}
