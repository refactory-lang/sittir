import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression, AttributeItem, Expression } from '../types.js';


class ArrayBuilder extends Builder<ArrayExpression> {
  private _length?: Builder<Expression>;
  private _children: Builder<Expression | AttributeItem>[] = [];

  constructor() { super(); }

  length(value: Builder<Expression>): this {
    this._length = value;
    return this;
  }

  children(...value: Builder<Expression | AttributeItem>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    if (this._length) parts.push(this.renderChild(this._length, ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayExpression {
    return {
      kind: 'array_expression',
      length: this._length?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as ArrayExpression;
  }

  override get nodeKind(): string { return 'array_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    if (this._length) parts.push({ kind: 'builder', builder: this._length, fieldName: 'length' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ArrayBuilder };

export function array(): ArrayBuilder {
  return new ArrayBuilder();
}

export interface ArrayExpressionOptions {
  length?: Builder<Expression>;
  children?: Builder<Expression | AttributeItem> | (Builder<Expression | AttributeItem>)[];
}

export namespace array {
  export function from(options: ArrayExpressionOptions): ArrayBuilder {
    const b = new ArrayBuilder();
    if (options.length !== undefined) b.length(options.length);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
