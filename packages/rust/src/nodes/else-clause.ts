import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ElseClause } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ElseClauseBuilder extends BaseBuilder<ElseClause> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('else');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ElseClause {
    return {
      kind: 'else_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ElseClause;
  }

  override get nodeKind(): string { return 'else_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'else', type: 'else' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function else_clause(children: Child): ElseClauseBuilder {
  return new ElseClauseBuilder(children);
}
