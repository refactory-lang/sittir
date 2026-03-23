import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IndexTypeQuery, PrimaryType } from '../types.js';


class IndexTypeQueryBuilder extends Builder<IndexTypeQuery> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('keyof');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IndexTypeQuery {
    return {
      kind: 'index_type_query',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as IndexTypeQuery;
  }

  override get nodeKind(): string { return 'index_type_query'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'keyof', type: 'keyof' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { IndexTypeQueryBuilder };

export function index_type_query(children: Builder): IndexTypeQueryBuilder {
  return new IndexTypeQueryBuilder(children);
}

export interface IndexTypeQueryOptions {
  children: Builder<PrimaryType> | (Builder<PrimaryType>)[];
}

export namespace index_type_query {
  export function from(options: IndexTypeQueryOptions): IndexTypeQueryBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new IndexTypeQueryBuilder(_ctor);
    return b;
  }
}
