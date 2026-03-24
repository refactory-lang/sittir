import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElifClause, ElseClause, Expression, IfStatement } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { elif_clause } from './elif-clause.js';
import type { ElifClauseOptions } from './elif-clause.js';
import { else_clause } from './else-clause.js';
import type { ElseClauseOptions } from './else-clause.js';


class IfStatementBuilder extends Builder<IfStatement> {
  private _condition: Builder<Expression>;
  private _consequence!: Builder<Block>;
  private _alternative: Builder<ElifClause | ElseClause>[] = [];

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  consequence(value: Builder<Block>): this {
    this._consequence = value;
    return this;
  }

  alternative(...value: Builder<ElifClause | ElseClause>[]): this {
    this._alternative = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    parts.push(':');
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    if (this._alternative.length > 0) parts.push(this.renderChildren(this._alternative, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfStatement {
    return {
      kind: 'if_statement',
      condition: this._condition.build(ctx),
      consequence: this._consequence ? this._consequence.build(ctx) : undefined,
      alternative: this._alternative.map(c => c.build(ctx)),
    } as IfStatement;
  }

  override get nodeKind(): 'if_statement' { return 'if_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    for (const child of this._alternative) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'alternative' });
    }
    return parts;
  }
}

export type { IfStatementBuilder };

export function if_statement(condition: Builder<Expression>): IfStatementBuilder {
  return new IfStatementBuilder(condition);
}

export interface IfStatementOptions {
  nodeKind: 'if_statement';
  condition: Builder<Expression>;
  consequence: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  alternative?: Builder<ElifClause | ElseClause> | ElifClauseOptions | ElseClauseOptions | (Builder<ElifClause | ElseClause> | ElifClauseOptions | ElseClauseOptions)[];
}

export namespace if_statement {
  export function from(options: Omit<IfStatementOptions, 'nodeKind'>): IfStatementBuilder {
    const b = new IfStatementBuilder(options.condition);
    if (options.consequence !== undefined) {
      const _v = options.consequence;
      b.consequence(_v instanceof Builder ? _v : block.from(_v));
    }
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.alternative(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'elif_clause': return elif_clause.from(_v);   case 'else_clause': return else_clause.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
