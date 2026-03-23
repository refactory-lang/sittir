import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { IndexTypeQuery } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class IndexTypeQueryBuilder extends BaseBuilder<IndexTypeQuery> {
  private _children: Child[] = [];

  constructor(children: Child) {
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

export function index_type_query(children: Child): IndexTypeQueryBuilder {
  return new IndexTypeQueryBuilder(children);
}
