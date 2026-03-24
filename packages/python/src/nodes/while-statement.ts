import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, Expression, WhileStatement } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';
import { else_clause } from './else-clause.js';
import type { ElseClauseOptions } from './else-clause.js';


class WhileStatementBuilder extends Builder<WhileStatement> {
  private _condition: Builder<Expression>;
  private _body!: Builder<Block>;
  private _alternative?: Builder<ElseClause>;

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    parts.push(':');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileStatement {
    return {
      kind: 'while_statement',
      condition: this._condition.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
      alternative: this._alternative ? this._alternative.build(ctx) : undefined,
    } as WhileStatement;
  }

  override get nodeKind(): 'while_statement' { return 'while_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    parts.push({ kind: 'token', text: ':', type: ':' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { WhileStatementBuilder };

export function while_statement(condition: Builder<Expression>): WhileStatementBuilder {
  return new WhileStatementBuilder(condition);
}

export interface WhileStatementOptions {
  nodeKind: 'while_statement';
  condition: Builder<Expression>;
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
  alternative?: Builder<ElseClause> | Omit<ElseClauseOptions, 'nodeKind'>;
}

export namespace while_statement {
  export function from(options: Omit<WhileStatementOptions, 'nodeKind'>): WhileStatementBuilder {
    const b = new WhileStatementBuilder(options.condition);
    if (options.body !== undefined) {
      const _v = options.body;
      b.body(_v instanceof Builder ? _v : block.from(_v));
    }
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      b.alternative(_v instanceof Builder ? _v : else_clause.from(_v));
    }
    return b;
  }
}
