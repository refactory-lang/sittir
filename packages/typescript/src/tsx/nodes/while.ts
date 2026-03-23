import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, Statement, WhileStatement } from '../types.js';


class WhileBuilder extends Builder<WhileStatement> {
  private _body!: Builder<Statement>;
  private _condition: Builder<ParenthesizedExpression>;

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
      body: this._body?.build(ctx),
      condition: this._condition.build(ctx),
    } as WhileStatement;
  }

  override get nodeKind(): string { return 'while_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'while', type: 'while' });
    if (this._condition) parts.push({ kind: 'builder', builder: this._condition, fieldName: 'condition' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WhileBuilder };

export function while_(condition: Builder<ParenthesizedExpression>): WhileBuilder {
  return new WhileBuilder(condition);
}

export interface WhileStatementOptions {
  body: Builder<Statement>;
  condition: Builder<ParenthesizedExpression>;
}

export namespace while_ {
  export function from(options: WhileStatementOptions): WhileBuilder {
    const b = new WhileBuilder(options.condition);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
