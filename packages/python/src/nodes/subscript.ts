import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, PrimaryExpression, Slice, Subscript } from '../types.js';
import { slice } from './slice.js';
import type { SliceOptions } from './slice.js';


class SubscriptBuilder extends Builder<Subscript> {
  private _value: Builder<PrimaryExpression>;
  private _subscript: Builder<Expression | Slice>[] = [];

  constructor(value: Builder<PrimaryExpression>) {
    super();
    this._value = value;
  }

  subscript(...value: Builder<Expression | Slice>[]): this {
    this._subscript = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._value) parts.push(this.renderChild(this._value, ctx));
    parts.push('[');
    if (this._subscript.length > 0) parts.push(this.renderChildren(this._subscript, ', ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Subscript {
    return {
      kind: 'subscript',
      value: this._value.build(ctx),
      subscript: this._subscript.map(c => c.build(ctx)),
    } as Subscript;
  }

  override get nodeKind(): 'subscript' { return 'subscript'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._subscript) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'subscript' });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { SubscriptBuilder };

export function subscript(value: Builder<PrimaryExpression>): SubscriptBuilder {
  return new SubscriptBuilder(value);
}

export interface SubscriptOptions {
  nodeKind: 'subscript';
  value: Builder<PrimaryExpression>;
  subscript: Builder<Expression | Slice> | Omit<SliceOptions, 'nodeKind'> | (Builder<Expression | Slice> | Omit<SliceOptions, 'nodeKind'>)[];
}

export namespace subscript {
  export function from(options: Omit<SubscriptOptions, 'nodeKind'>): SubscriptBuilder {
    const b = new SubscriptBuilder(options.value);
    if (options.subscript !== undefined) {
      const _v = options.subscript;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.subscript(..._arr.map(_v => _v instanceof Builder ? _v : slice.from(_v)));
    }
    return b;
  }
}
