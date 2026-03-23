import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DecoratorMemberExpression, Identifier, MemberExpression, PropertyIdentifier } from '../types.js';


class DecoratorMemberExpressionBuilder extends Builder<DecoratorMemberExpression> {
  private _object: Builder<Identifier | MemberExpression>;
  private _property!: Builder<PropertyIdentifier>;

  constructor(object: Builder<Identifier | MemberExpression>) {
    super();
    this._object = object;
  }

  property(value: Builder<PropertyIdentifier>): this {
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

  build(ctx?: RenderContext): DecoratorMemberExpression {
    return {
      kind: 'decorator_member_expression',
      object: this._object.build(ctx),
      property: this._property?.build(ctx),
    } as DecoratorMemberExpression;
  }

  override get nodeKind(): string { return 'decorator_member_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    return parts;
  }
}

export type { DecoratorMemberExpressionBuilder };

export function decorator_member_expression(object: Builder<Identifier | MemberExpression>): DecoratorMemberExpressionBuilder {
  return new DecoratorMemberExpressionBuilder(object);
}

export interface DecoratorMemberExpressionOptions {
  object: Builder<Identifier | MemberExpression> | string;
  property: Builder<PropertyIdentifier> | string;
}

export namespace decorator_member_expression {
  export function from(options: DecoratorMemberExpressionOptions): DecoratorMemberExpressionBuilder {
    const _ctor = options.object;
    const b = new DecoratorMemberExpressionBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.property !== undefined) {
      const _v = options.property;
      b.property(typeof _v === 'string' ? new LeafBuilder('property_identifier', _v) : _v);
    }
    return b;
  }
}
