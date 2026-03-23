import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ForInStatement, Identifier, MemberExpression, NonNullExpression, ObjectPattern, ParenthesizedExpression, SequenceExpression, Statement, SubscriptExpression, Undefined } from '../types.js';


class ForInBuilder extends Builder<ForInStatement> {
  private _body!: Builder<Statement>;
  private _kind?: Builder;
  private _left: Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | ParenthesizedExpression | SubscriptExpression | Undefined>;
  private _operator!: Builder;
  private _right!: Builder<Expression | SequenceExpression>;
  private _value?: Builder<Expression>;

  constructor(left: Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | ParenthesizedExpression | SubscriptExpression | Undefined>) {
    super();
    this._left = left;
  }

  body(value: Builder<Statement>): this {
    this._body = value;
    return this;
  }

  kind(value: Builder): this {
    this._kind = value;
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

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('for');
    parts.push('(');
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    parts.push(')');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._kind) parts.push(this.renderChild(this._kind, ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForInStatement {
    return {
      kind: 'for_in_statement',
      body: this._body?.build(ctx),
      left: this._left.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
      value: this._value?.build(ctx),
    } as ForInStatement;
  }

  override get nodeKind(): string { return 'for_in_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._kind) parts.push({ kind: 'builder', builder: this._kind, fieldName: 'kind' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { ForInBuilder };

export function for_in(left: Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | ParenthesizedExpression | SubscriptExpression | Undefined>): ForInBuilder {
  return new ForInBuilder(left);
}

export interface ForInStatementOptions {
  body: Builder<Statement>;
  kind?: Builder;
  left: Builder<ArrayPattern | Identifier | MemberExpression | NonNullExpression | ObjectPattern | ParenthesizedExpression | SubscriptExpression | Undefined>;
  operator: Builder;
  right: Builder<Expression | SequenceExpression>;
  value?: Builder<Expression>;
}

export namespace for_in {
  export function from(options: ForInStatementOptions): ForInBuilder {
    const b = new ForInBuilder(options.left);
    if (options.body !== undefined) b.body(options.body);
    if (options.kind !== undefined) b.kind(options.kind);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
