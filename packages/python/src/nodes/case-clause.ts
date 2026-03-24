import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, CaseClause, CasePattern, IfClause } from '../types.js';
import { if_clause } from './if-clause.js';
import type { IfClauseOptions } from './if-clause.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { case_pattern } from './case-pattern.js';
import type { CasePatternOptions } from './case-pattern.js';


class CaseClauseBuilder extends Builder<CaseClause> {
  private _guard?: Builder<IfClause>;
  private _consequence: Builder<Block>;
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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    if (this._guard) parts.push(this.renderChild(this._guard, ctx));
    parts.push(':');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CaseClause {
    return {
      kind: 'case_clause',
      guard: this._guard ? this._guard.build(ctx) : undefined,
      consequence: this._consequence.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as CaseClause;
  }

  override get nodeKind(): 'case_clause' { return 'case_clause'; }

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
  nodeKind: 'case_clause';
  guard?: Builder<IfClause> | Omit<IfClauseOptions, 'nodeKind'>;
  consequence: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  children?: Builder<CasePattern> | Omit<CasePatternOptions, 'nodeKind'> | (Builder<CasePattern> | Omit<CasePatternOptions, 'nodeKind'>)[];
}

export namespace case_clause {
  export function from(options: Omit<CaseClauseOptions, 'nodeKind'>): CaseClauseBuilder {
    const _ctor = options.consequence;
    const b = new CaseClauseBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    if (options.guard !== undefined) {
      const _v = options.guard;
      b.guard(_v instanceof Builder ? _v : if_clause.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : case_pattern.from(_x)));
    }
    return b;
  }
}
