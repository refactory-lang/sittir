import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SubscriptExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SubscriptBuilder extends BaseBuilder<SubscriptExpression> {
  private _index: Child;
  private _object!: Child;
  private _optionalChain?: Child;

  constructor(index: Child) {
    super();
    this._index = index;
  }

  object(value: Child): this {
    this._object = value;
    return this;
  }

  optionalChain(value: Child): this {
    this._optionalChain = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('subscript');
    if (this._index) parts.push(this.renderChild(this._index, ctx));
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._optionalChain) parts.push(this.renderChild(this._optionalChain, ctx));
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
    parts.push({ kind: 'token', text: 'subscript' });
    if (this._index) parts.push({ kind: 'builder', builder: this._index, fieldName: 'index' });
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._optionalChain) parts.push({ kind: 'builder', builder: this._optionalChain, fieldName: 'optionalChain' });
    return parts;
  }
}

export function subscript(index: Child): SubscriptBuilder {
  return new SubscriptBuilder(index);
}
