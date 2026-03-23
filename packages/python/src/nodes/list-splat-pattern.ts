import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, Identifier, ListSplatPattern, Subscript } from '../types.js';


class ListSplatPatternBuilder extends Builder<ListSplatPattern> {
  private _children: Builder<Attribute | Identifier | Subscript>[] = [];

  constructor(children: Builder<Attribute | Identifier | Subscript>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ListSplatPattern {
    return {
      kind: 'list_splat_pattern',
      children: this._children[0]?.build(ctx),
    } as ListSplatPattern;
  }

  override get nodeKind(): string { return 'list_splat_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ListSplatPatternBuilder };

export function list_splat_pattern(children: Builder<Attribute | Identifier | Subscript>): ListSplatPatternBuilder {
  return new ListSplatPatternBuilder(children);
}

export interface ListSplatPatternOptions {
  children: Builder<Attribute | Identifier | Subscript> | (Builder<Attribute | Identifier | Subscript>)[];
}

export namespace list_splat_pattern {
  export function from(options: ListSplatPatternOptions): ListSplatPatternBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ListSplatPatternBuilder(_ctor);
    return b;
  }
}
