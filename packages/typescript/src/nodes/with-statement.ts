import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, Statement, WithStatement } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';


class WithStatementBuilder extends Builder<WithStatement> {
  private _object: Builder<ParenthesizedExpression>;
  private _body!: Builder<Statement>;

  constructor(object: Builder<ParenthesizedExpression>) {
    super();
    this._object = object;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('with');
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): WithStatement {
    return {
      kind: 'with_statement',
      object: this._object.build(ctx),
      body: this._body?.build(ctx),
    } as WithStatement;
  }

  override get nodeKind(): string { return 'with_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'with', type: 'with' });
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { WithStatementBuilder };

export function with_statement(object: Builder<ParenthesizedExpression>): WithStatementBuilder {
  return new WithStatementBuilder(object);
}

export interface WithStatementOptions {
  object: Builder<ParenthesizedExpression> | ParenthesizedExpressionOptions;
  body: Builder<Statement>;
}

export namespace with_statement {
  export function from(options: WithStatementOptions): WithStatementBuilder {
    const _ctor = options.object;
    const b = new WithStatementBuilder(_ctor instanceof Builder ? _ctor : parenthesized_expression.from(_ctor as ParenthesizedExpressionOptions));
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
