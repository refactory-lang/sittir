import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, OptionalChain, PredefinedType, SequenceExpression, SubscriptExpression } from '../types.js';


class SubscriptBuilder extends Builder<SubscriptExpression> {
  private _index!: Builder;
  private _object: Builder;
  private _optionalChain?: Builder;

  constructor(object: Builder) {
    super();
    this._object = object;
  }

  index(value: Builder): this {
    this._index = value;
    return this;
  }

  optionalChain(value: Builder): this {
    this._optionalChain = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._optionalChain) parts.push(this.renderChild(this._optionalChain, ctx));
    parts.push('[');
    if (this._index) parts.push(this.renderChild(this._index, ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SubscriptExpression {
    return {
      kind: 'subscript_expression',
      index: this._index ? this.renderChild(this._index, ctx) : undefined,
      object: this.renderChild(this._object, ctx),
      optionalChain: this._optionalChain ? this.renderChild(this._optionalChain, ctx) : undefined,
    } as unknown as SubscriptExpression;
  }

  override get nodeKind(): string { return 'subscript_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._optionalChain) parts.push({ kind: 'builder', builder: this._optionalChain, fieldName: 'optionalChain' });
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._index) parts.push({ kind: 'builder', builder: this._index, fieldName: 'index' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { SubscriptBuilder };

export function subscript(object: Builder): SubscriptBuilder {
  return new SubscriptBuilder(object);
}

export interface SubscriptExpressionOptions {
  index: Builder<Expression | PredefinedType | SequenceExpression>;
  object: Builder<Expression>;
  optionalChain?: Builder<OptionalChain> | string;
}

export namespace subscript {
  export function from(options: SubscriptExpressionOptions): SubscriptBuilder {
    const b = new SubscriptBuilder(options.object);
    if (options.index !== undefined) b.index(options.index);
    if (options.optionalChain !== undefined) {
      const _v = options.optionalChain;
      b.optionalChain(typeof _v === 'string' ? new LeafBuilder('optional_chain', _v) : _v);
    }
    return b;
  }
}
