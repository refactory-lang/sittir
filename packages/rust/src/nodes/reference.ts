import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, MutableSpecifier, ReferenceExpression } from '../types.js';


class ReferenceBuilder extends Builder<ReferenceExpression> {
  private _value: Builder;
  private _children: Builder[] = [];

  constructor(value: Builder) {
    super();
    this._value = value;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    parts.push('raw');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferenceExpression {
    return {
      kind: 'reference_expression',
      value: this.renderChild(this._value, ctx),
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReferenceExpression;
  }

  override get nodeKind(): string { return 'reference_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    parts.push({ kind: 'token', text: 'raw', type: 'raw' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    return parts;
  }
}

export type { ReferenceBuilder };

export function reference(value: Builder): ReferenceBuilder {
  return new ReferenceBuilder(value);
}

export interface ReferenceExpressionOptions {
  value: Builder<Expression>;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace reference {
  export function from(options: ReferenceExpressionOptions): ReferenceBuilder {
    const b = new ReferenceBuilder(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
