import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, CaseClause, CasePattern, IfClause } from '../types.js';


class CaseClauseBuilder extends Builder<CaseClause> {
  private _consequence: Builder<Block>;
  private _guard?: Builder<IfClause>;
  private _children: Builder<CasePattern>[] = [];

  constructor(consequence: Builder<Block>) {
    super();
    this._consequence = consequence;
  }

  guard(value: Builder<IfClause>): this {
    this._guard = value;
    return this;
  }

  children(...value: Builder<CasePattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('case');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    if (this._guard) parts.push(this.renderChild(this._guard, ctx));
    parts.push(':');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CaseClause {
    return {
      kind: 'case_clause',
      consequence: this._consequence.build(ctx),
      guard: this._guard?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as CaseClause;
  }

  override get nodeKind(): string { return 'case_clause'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'case', type: 'case' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    if (this._guard) parts.push({ kind: 'builder', builder: this._guard, fieldName: 'guard' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    return parts;
  }
}

export type { CaseClauseBuilder };

export function case_clause(consequence: Builder<Block>): CaseClauseBuilder {
  return new CaseClauseBuilder(consequence);
}

export interface CaseClauseOptions {
  consequence: Builder<Block>;
  guard?: Builder<IfClause>;
  children?: Builder<CasePattern> | (Builder<CasePattern>)[];
}

export namespace case_clause {
  export function from(options: CaseClauseOptions): CaseClauseBuilder {
    const b = new CaseClauseBuilder(options.consequence);
    if (options.guard !== undefined) b.guard(options.guard);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
