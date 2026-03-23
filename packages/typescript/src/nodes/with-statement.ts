import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ParenthesizedExpression, Statement, WithStatement } from '../types.js';


class WithStatementBuilder extends Builder<WithStatement> {
  private _body!: Builder<Statement>;
  private _object: Builder<ParenthesizedExpression>;

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
      body: this._body?.build(ctx),
      object: this._object.build(ctx),
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
  body: Builder<Statement>;
  object: Builder<ParenthesizedExpression>;
}

export namespace with_statement {
  export function from(options: WithStatementOptions): WithStatementBuilder {
    const b = new WithStatementBuilder(options.object);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
