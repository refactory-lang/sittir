import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ElseClause, Expression, WhileStatement } from '../types.js';


class WhileStatementBuilder extends Builder<WhileStatement> {
  private _alternative?: Builder<ElseClause>;
  private _body!: Builder<Block>;
  private _condition: Builder<Expression>;

  constructor(condition: Builder<Expression>) {
    super();
    this._condition = condition;
  }

  alternative(value: Builder<ElseClause>): this {
    this._alternative = value;
    return this;
  }

  body(value: Builder<Block>): this {
    this._body = value;
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
      alternative: this._alternative?.build(ctx),
      body: this._body?.build(ctx),
      condition: this._condition.build(ctx),
    } as WhileStatement;
  }

  override get nodeKind(): string { return 'while_statement'; }

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
  alternative?: Builder<ElseClause>;
  body: Builder<Block>;
  condition: Builder<Expression>;
}

export namespace while_statement {
  export function from(options: WhileStatementOptions): WhileStatementBuilder {
    const b = new WhileStatementBuilder(options.condition);
    if (options.alternative !== undefined) b.alternative(options.alternative);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
