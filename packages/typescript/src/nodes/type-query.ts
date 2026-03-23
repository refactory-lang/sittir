import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TypeQuery } from '../types.js';


class TypeQueryBuilder extends BaseBuilder<TypeQuery> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('typeof');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    parts.push({ kind: 'token', text: 'typeof', type: 'typeof' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function type_query(children: BaseBuilder): TypeQueryBuilder {
  return new TypeQueryBuilder(children);
}
