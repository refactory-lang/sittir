import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ForInStatement, Identifier, MemberExpression, NonNullExpression, ObjectPattern, ParenthesizedExpression, SequenceExpression, Statement, SubscriptExpression, Undefined } from '../types.js';


class ForInStatementBuilder extends Builder<ForInStatement> {
  private _left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
  private _kind?: Builder;
  private _value?: Builder<Expression>;
  private _operator!: Builder;
  private _right!: Builder<Expression | SequenceExpression>;
  private _body!: Builder<Statement>;

  constructor(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>) {
    super();
    this._left = left;
  }

  kind(value: Builder): this {
    this._kind = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<Expression | SequenceExpression>): this {
    this._right = value;
    return this;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForInStatement {
    return {
      kind: 'for_in_statement',
      left: this._left.build(ctx),
      value: this._value?.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
      body: this._body?.build(ctx),
    } as ForInStatement;
  }

  override get nodeKind(): string { return 'for_in_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._kind) parts.push({ kind: 'builder', builder: this._kind, fieldName: 'kind' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ForInStatementBuilder };

export function for_in_statement(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>): ForInStatementBuilder {
  return new ForInStatementBuilder(left);
}

export interface ForInStatementOptions {
  left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
  kind?: Builder;
  value?: Builder<Expression>;
  operator: Builder;
  right: Builder<Expression | SequenceExpression>;
  body: Builder<Statement>;
}

export namespace for_in_statement {
  export function from(options: ForInStatementOptions): ForInStatementBuilder {
    const b = new ForInStatementBuilder(options.left);
    if (options.kind !== undefined) b.kind(options.kind);
    if (options.value !== undefined) b.value(options.value);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    if (options.body !== undefined) b.body(options.body);
    return b;
  }
}
