import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, MemberExpression, OptionalChain, PrivatePropertyIdentifier, PropertyIdentifier } from '../types.js';


class MemberExpressionBuilder extends Builder<MemberExpression> {
  private _object: Builder<Expression>;
  private _optionalChain?: Builder<OptionalChain>;
  private _property!: Builder<PrivatePropertyIdentifier | PropertyIdentifier>;

  constructor(object: Builder<Expression>) {
    super();
    this._object = object;
  }

  optionalChain(value: Builder<OptionalChain>): this {
    this._optionalChain = value;
    return this;
  }

  property(value: Builder<PrivatePropertyIdentifier | PropertyIdentifier>): this {
    this._property = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    parts.push('.');
    if (this._property) parts.push(this.renderChild(this._property, ctx));
    if (this._optionalChain) parts.push(this.renderChild(this._optionalChain, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MemberExpression {
    return {
      kind: 'member_expression',
      object: this._object.build(ctx),
      optionalChain: this._optionalChain?.build(ctx),
      property: this._property?.build(ctx),
    } as MemberExpression;
  }

  override get nodeKind(): string { return 'member_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    if (this._optionalChain) parts.push({ kind: 'builder', builder: this._optionalChain, fieldName: 'optionalChain' });
    return parts;
  }
}

export type { MemberExpressionBuilder };

export function member_expression(object: Builder<Expression>): MemberExpressionBuilder {
  return new MemberExpressionBuilder(object);
}

export interface MemberExpressionOptions {
  object: Builder<Expression>;
  optionalChain?: Builder<OptionalChain> | string;
  property: Builder<PrivatePropertyIdentifier | PropertyIdentifier>;
}

export namespace member_expression {
  export function from(options: MemberExpressionOptions): MemberExpressionBuilder {
    const b = new MemberExpressionBuilder(options.object);
    if (options.optionalChain !== undefined) {
      const _v = options.optionalChain;
      b.optionalChain(typeof _v === 'string' ? new LeafBuilder('optional_chain', _v) : _v);
    }
    if (options.property !== undefined) b.property(options.property);
    return b;
  }
}
