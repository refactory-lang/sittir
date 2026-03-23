import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ForInStatement, Identifier, MemberExpression, NonNullExpression, ObjectPattern, ParenthesizedExpression, SequenceExpression, Statement, SubscriptExpression, Undefined } from '../types.js';


class ForInBuilder extends Builder<ForInStatement> {
  private _body!: Builder;
  private _kind?: Builder;
  private _left: Builder;
  private _operator!: Builder;
  private _right!: Builder;
  private _value?: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  body(value: Builder): this {
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

  right(value: Builder): this {
    this._right = value;
    return this;
  }

  value(value: Builder): this {
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
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      left: this.renderChild(this._left, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
    } as unknown as ForInStatement;
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

export function for_in(left: Builder): ForInBuilder {
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
