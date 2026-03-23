import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { WhereClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class WhereClauseBuilder extends BaseBuilder<WhereClause> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('where');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhereClause {
    return {
      kind: 'where_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as WhereClause;
  }

  override get nodeKind(): string { return 'where_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'where' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function where_clause(): WhereClauseBuilder {
  return new WhereClauseBuilder();
}
