import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, IfClause } from '../types.js';


class IfClauseBuilder extends Builder<IfClause> {
  private _children: Builder<Expression>[] = [];

  constructor(children: Builder<Expression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfClause {
    return {
      kind: 'if_clause',
      children: this._children[0]?.build(ctx),
    } as IfClause;
  }

  override get nodeKind(): string { return 'if_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { IfClauseBuilder };

export function if_clause(children: Builder<Expression>): IfClauseBuilder {
  return new IfClauseBuilder(children);
}

export interface IfClauseOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace if_clause {
  export function from(options: IfClauseOptions): IfClauseBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new IfClauseBuilder(_ctor);
    return b;
  }
}
