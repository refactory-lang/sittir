import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ElseClause, IfStatement, ParenthesizedExpression, Statement } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { else_clause } from './else-clause.js';
import type { ElseClauseOptions } from './else-clause.js';


class IfStatementBuilder extends Builder<IfStatement> {
  private _condition: Builder<ParenthesizedExpression>;
  private _consequence!: Builder<Statement>;
  private _alternative?: Builder<ElseClause>;

  constructor(condition: Builder<ParenthesizedExpression>) {
    super();
    this._condition = condition;
  }

  consequence(value: Builder<Statement>): this {
    this._consequence = value;
    return this;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('if');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._consequence) parts.push(this.renderChild(this._consequence, ctx));
    if (this._alternative) parts.push(this.renderChild(this._alternative, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IfStatement {
    return {
      kind: 'if_statement',
      condition: this._condition.build(ctx),
      consequence: this._consequence ? this._consequence.build(ctx) : undefined,
      alternative: this._alternative ? this._alternative.build(ctx) : undefined,
    } as IfStatement;
  }

  override get nodeKind(): 'if_statement' { return 'if_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'if', type: 'if' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._consequence) parts.push({ kind: 'builder', builder: this._consequence, fieldName: 'consequence' });
    if (this._alternative) parts.push({ kind: 'builder', builder: this._alternative, fieldName: 'alternative' });
    return parts;
  }
}

export type { IfStatementBuilder };

export function if_statement(condition: Builder<ParenthesizedExpression>): IfStatementBuilder {
  return new IfStatementBuilder(condition);
}

export interface IfStatementOptions {
  nodeKind: 'if_statement';
  condition: Builder<ParenthesizedExpression> | Omit<ParenthesizedExpressionOptions, 'nodeKind'>;
  consequence: Builder<Statement>;
  alternative?: Builder<ElseClause> | Omit<ElseClauseOptions, 'nodeKind'>;
}

export namespace if_statement {
  export function from(options: Omit<IfStatementOptions, 'nodeKind'>): IfStatementBuilder {
    const _ctor = options.condition;
    const b = new IfStatementBuilder(_ctor instanceof Builder ? _ctor : parenthesized_expression.from(_ctor));
    if (options.consequence !== undefined) b.consequence(options.consequence);
    if (options.alternative !== undefined) {
      const _v = options.alternative;
      b.alternative(_v instanceof Builder ? _v : else_clause.from(_v));
    }
    return b;
  }
}
