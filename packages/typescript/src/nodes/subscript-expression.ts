import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, OptionalChain, PrimaryExpression, SequenceExpression, SubscriptExpression } from '../types.js';
import { sequence_expression } from './sequence-expression.js';
import type { SequenceExpressionOptions } from './sequence-expression.js';


class SubscriptExpressionBuilder extends Builder<SubscriptExpression> {
  private _object: Builder<Expression | PrimaryExpression>;
  private _optionalChain?: Builder<OptionalChain>;
  private _index!: Builder<Expression | SequenceExpression>;

  constructor(object: Builder<Expression | PrimaryExpression>) {
    super();
    this._object = object;
  }

  optionalChain(value: Builder<OptionalChain>): this {
    this._optionalChain = value;
    return this;
  }

  index(value: Builder<Expression | SequenceExpression>): this {
    this._index = value;
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
      object: this._object.build(ctx),
      optionalChain: this._optionalChain ? this._optionalChain.build(ctx) : undefined,
      index: this._index ? this._index.build(ctx) : undefined,
    } as SubscriptExpression;
  }

  override get nodeKind(): 'subscript_expression' { return 'subscript_expression'; }

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

export function subscript_expression(object: Builder<Expression | PrimaryExpression>): SubscriptExpressionBuilder {
  return new SubscriptExpressionBuilder(object);
}

export interface SubscriptExpressionOptions {
  nodeKind: 'subscript_expression';
  object: Builder<Expression | PrimaryExpression>;
  optionalChain?: Builder<OptionalChain> | string;
  index: Builder<Expression | SequenceExpression> | Omit<SequenceExpressionOptions, 'nodeKind'>;
}

export namespace subscript_expression {
  export function from(options: Omit<SubscriptExpressionOptions, 'nodeKind'>): SubscriptExpressionBuilder {
    const b = new SubscriptExpressionBuilder(options.object);
    if (options.optionalChain !== undefined) {
      const _v = options.optionalChain;
      b.optionalChain(typeof _v === 'string' ? new LeafBuilder('optional_chain', _v) : _v);
    }
    if (options.index !== undefined) {
      const _v = options.index;
      b.index(_v instanceof Builder ? _v : sequence_expression.from(_v));
    }
    return b;
  }
}
