import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeQuery } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TypeQueryBuilder extends BaseBuilder<TypeQuery> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TypeQuery {
    return {
      kind: 'type_query',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TypeQuery;
  }

  override get nodeKind(): string { return 'type_query'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function type_query(children: Child): TypeQueryBuilder {
  return new TypeQueryBuilder(children);
}
