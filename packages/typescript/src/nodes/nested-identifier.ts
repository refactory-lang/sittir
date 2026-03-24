import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MemberExpression, NestedIdentifier, PropertyIdentifier } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';


class NestedIdentifierBuilder extends Builder<NestedIdentifier> {
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

  build(ctx?: RenderContext): NestedIdentifier {
    return {
      kind: 'nested_identifier',
      object: this._object.build(ctx),
      property: this._property ? this._property.build(ctx) : undefined,
    } as NestedIdentifier;
  }

  override get nodeKind(): 'nested_identifier' { return 'nested_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    return parts;
  }
}

export type { NestedIdentifierBuilder };

export function nested_identifier(object: Builder<Identifier | MemberExpression>): NestedIdentifierBuilder {
  return new NestedIdentifierBuilder(object);
}

export interface NestedIdentifierOptions {
  nodeKind: 'nested_identifier';
  object: Builder<Identifier | MemberExpression> | string | Omit<MemberExpressionOptions, 'nodeKind'>;
  property: Builder<PropertyIdentifier> | string;
}

export namespace nested_identifier {
  export function from(options: Omit<NestedIdentifierOptions, 'nodeKind'>): NestedIdentifierBuilder {
    const _ctor = options.object;
    const b = new NestedIdentifierBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor instanceof Builder ? _ctor : member_expression.from(_ctor));
    if (options.property !== undefined) {
      const _v = options.property;
      b.property(typeof _v === 'string' ? new LeafBuilder('property_identifier', _v) : _v);
    }
    return b;
  }
}
