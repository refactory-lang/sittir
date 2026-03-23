import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MemberExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MemberBuilder extends BaseBuilder<MemberExpression> {
  private _object: Child;
  private _optionalChain?: Child;
  private _property!: Child;

  constructor(object: Child) {
    super();
    this._object = object;
  }

  optionalChain(value: Child): this {
    this._optionalChain = value;
    return this;
  }

  property(value: Child): this {
    this._property = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    parts.push('.');
    if (this._property) parts.push(this.renderChild(this._property, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MemberExpression {
    return {
      kind: 'member_expression',
      object: this.renderChild(this._object, ctx),
      optionalChain: this._optionalChain ? this.renderChild(this._optionalChain, ctx) : undefined,
      property: this._property ? this.renderChild(this._property, ctx) : undefined,
    } as unknown as MemberExpression;
  }

  override get nodeKind(): string { return 'member_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    return parts;
  }
}

export function member(object: Child): MemberBuilder {
  return new MemberBuilder(object);
}
