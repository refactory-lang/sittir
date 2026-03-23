import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, Expression, ForExpression, Label, Pattern } from '../types.js';


class ForExpressionBuilder extends Builder<ForExpression> {
  private _body!: Builder<Block>;
  private _pattern: Builder<Pattern>;
  private _value!: Builder<Expression>;
  private _children: Builder<Label>[] = [];

  constructor(pattern: Builder<Pattern>) {
    super();
    this._pattern = pattern;
  }

  body(value: Builder<Block>): this {
    this._body = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<Label>[]): this {
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
      body: this._body?.build(ctx),
      pattern: this._pattern.build(ctx),
      value: this._value?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as ForExpression;
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

export type { ForExpressionBuilder };

export function for_expression(pattern: Builder<Pattern>): ForExpressionBuilder {
  return new ForExpressionBuilder(pattern);
}

export interface ForExpressionOptions {
  body: Builder<Block>;
  pattern: Builder<Pattern>;
  value: Builder<Expression>;
  children?: Builder<Label> | (Builder<Label>)[];
}

export namespace for_expression {
  export function from(options: ForExpressionOptions): ForExpressionBuilder {
    const b = new ForExpressionBuilder(options.pattern);
    if (options.body !== undefined) b.body(options.body);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
