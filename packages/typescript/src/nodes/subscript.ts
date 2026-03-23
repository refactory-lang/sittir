import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SubscriptExpression } from '../types.js';


class SubscriptBuilder extends BaseBuilder<SubscriptExpression> {
  private _index: BaseBuilder;
  private _object!: BaseBuilder;
  private _optionalChain?: BaseBuilder;

  constructor(index: BaseBuilder) {
    super();
    this._index = index;
  }

  object(value: BaseBuilder): this {
    this._object = value;
    return this;
  }

  optionalChain(value: BaseBuilder): this {
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
      index: this.renderChild(this._index, ctx),
      object: this._object ? this.renderChild(this._object, ctx) : undefined,
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

export function subscript(index: BaseBuilder): SubscriptBuilder {
  return new SubscriptBuilder(index);
}
