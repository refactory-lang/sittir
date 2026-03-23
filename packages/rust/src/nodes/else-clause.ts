import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ElseClause, IfExpression } from '../types.js';


class ElseClauseBuilder extends Builder<ElseClause> {
  private _children: Builder<IfExpression>[] = [];

  constructor(children: Builder<IfExpression>) {
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
      children: this._children[0]?.build(ctx),
    } as ElseClause;
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

export type { ElseClauseBuilder };

export function else_clause(children: Builder<IfExpression>): ElseClauseBuilder {
  return new ElseClauseBuilder(children);
}

export interface ElseClauseOptions {
  children: Builder<IfExpression> | (Builder<IfExpression>)[];
}

export namespace else_clause {
  export function from(options: ElseClauseOptions): ElseClauseBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ElseClauseBuilder(_ctor);
    return b;
  }
}
