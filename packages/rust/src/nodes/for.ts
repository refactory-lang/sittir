import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ForBuilder extends BaseBuilder<ForExpression> {
  private _body: Child;
  private _pattern!: Child;
  private _value!: Child;
  private _children: Child[] = [];

  constructor(body: Child) {
    super();
    this._body = body;
  }

  pattern(value: Child): this {
    this._pattern = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('for');
    if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
    parts.push('in');
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ForExpression {
    return {
      kind: 'for_expression',
      body: this.renderChild(this._body, ctx),
      pattern: this._pattern ? this.renderChild(this._pattern, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ForExpression;
  }

  override get nodeKind(): string { return 'for_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'for', type: 'for' });
    if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
    parts.push({ kind: 'token', text: 'in', type: 'in' });
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export function for_(body: Child): ForBuilder {
  return new ForBuilder(body);
}
