import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, Statement, WhileStatement } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';


class WhileStatementBuilder extends Builder<WhileStatement> {
  private _condition: Builder<ParenthesizedExpression>;
  private _body!: Builder<Statement>;

  constructor(condition: Builder<ParenthesizedExpression>) {
    super();
    this._condition = condition;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('while');
    if (this._condition) parts.push(this.renderChild(this._condition, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WhileStatement {
    return {
      kind: 'while_statement',
      condition: this._condition.build(ctx),
      body: this._body ? this._body.build(ctx) : undefined,
    } as WhileStatement;
  }

  override get nodeKind(): 'while_statement' { return 'while_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WhileStatementBuilder };

export function while_statement(condition: Builder<ParenthesizedExpression>): WhileStatementBuilder {
  return new WhileStatementBuilder(condition);
}

export interface WhileStatementOptions {
  nodeKind: 'while_statement';
  condition: Builder<ParenthesizedExpression> | Omit<ParenthesizedExpressionOptions, 'nodeKind'>;
  body: Builder<Statement>;
}

export namespace while_statement {
  export function from(options: Omit<WhileStatementOptions, 'nodeKind'>): WhileStatementBuilder {
    const _ctor = options.condition;
    const b = new WhileStatementBuilder(_ctor instanceof Builder ? _ctor : parenthesized_expression.from(_ctor));
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
