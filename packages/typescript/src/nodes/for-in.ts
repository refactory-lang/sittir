import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForInStatement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ForInBuilder extends BaseBuilder<ForInStatement> {
  private _body: Child;
  private _kind?: Child;
  private _left!: Child;
  private _operator!: Child;
  private _right!: Child;
  private _value?: Child;

  constructor(body: Child) {
    super();
    this._body = body;
  }

  kind(value: Child): this {
    this._kind = value;
    return this;
  }

  left(value: Child): this {
    this._left = value;
    return this;
  }

  operator(value: Child): this {
    this._operator = value;
    return this;
  }

  right(value: Child): this {
    this._right = value;
    return this;
  }

  value(value: Child): this {
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
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForInStatement {
    return {
      kind: 'for_in_statement',
      body: this.renderChild(this._body, ctx),
      left: this._left ? this.renderChild(this._left, ctx) : undefined,
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
    return parts;
  }
}

export function for_in(body: Child): ForInBuilder {
  return new ForInBuilder(body);
}
