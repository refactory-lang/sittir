import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, OptionalChain, PredefinedType, SequenceExpression, SubscriptExpression } from '../types.js';


class SubscriptExpressionBuilder extends Builder<SubscriptExpression> {
  private _index!: Builder<Expression | PredefinedType | SequenceExpression>;
  private _object: Builder<Expression>;
  private _optionalChain?: Builder<OptionalChain>;

  constructor(object: Builder<Expression>) {
    super();
    this._object = object;
  }

  index(value: Builder<Expression | PredefinedType | SequenceExpression>): this {
    this._index = value;
    return this;
  }

  optionalChain(value: Builder<OptionalChain>): this {
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
      index: this._index?.build(ctx),
      object: this._object.build(ctx),
      optionalChain: this._optionalChain?.build(ctx),
    } as SubscriptExpression;
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

export type { SubscriptExpressionBuilder };

export function subscript_expression(object: Builder<Expression>): SubscriptExpressionBuilder {
  return new SubscriptExpressionBuilder(object);
}

export interface SubscriptExpressionOptions {
  index: Builder<Expression | PredefinedType | SequenceExpression>;
  object: Builder<Expression>;
  optionalChain?: Builder<OptionalChain> | string;
}

export namespace subscript_expression {
  export function from(options: SubscriptExpressionOptions): SubscriptExpressionBuilder {
    const b = new SubscriptExpressionBuilder(options.object);
    if (options.index !== undefined) b.index(options.index);
    if (options.optionalChain !== undefined) {
      const _v = options.optionalChain;
      b.optionalChain(typeof _v === 'string' ? new LeafBuilder('optional_chain', _v) : _v);
    }
    return b;
  }
}
