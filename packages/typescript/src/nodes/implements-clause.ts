import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImplementsClause } from '../types.js';


class ImplementsClauseBuilder extends BaseBuilder<ImplementsClause> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('implements');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImplementsClause {
    return {
      kind: 'implements_clause',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImplementsClause;
  }

  override get nodeKind(): string { return 'implements_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'implements', type: 'implements' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function implements_clause(children: BaseBuilder[]): ImplementsClauseBuilder {
  return new ImplementsClauseBuilder(children);
}
