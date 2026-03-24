import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, Identifier, PrimaryExpression } from '../types.js';


class AttributeBuilder extends Builder<Attribute> {
  private _object: Builder<PrimaryExpression>;
  private _attribute!: Builder<Identifier>;

  constructor(object: Builder<PrimaryExpression>) {
    super();
    this._object = object;
  }

  attribute(value: Builder<Identifier>): this {
    this._attribute = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    parts.push('.');
    if (this._attribute) parts.push(this.renderChild(this._attribute, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Attribute {
    return {
      kind: 'attribute',
      object: this._object.build(ctx),
      attribute: this._attribute ? this._attribute.build(ctx) : undefined,
    } as Attribute;
  }

  override get nodeKind(): 'attribute' { return 'attribute'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._attribute) parts.push({ kind: 'builder', builder: this._attribute, fieldName: 'attribute' });
    return parts;
  }
}

export type { AttributeBuilder };

export function attribute(object: Builder<PrimaryExpression>): AttributeBuilder {
  return new AttributeBuilder(object);
}

export interface AttributeOptions {
  nodeKind: 'attribute';
  object: Builder<PrimaryExpression>;
  attribute: Builder<Identifier> | string;
}

export namespace attribute {
  export function from(options: Omit<AttributeOptions, 'nodeKind'>): AttributeBuilder {
    const b = new AttributeBuilder(options.object);
    if (options.attribute !== undefined) {
      const _v = options.attribute;
      b.attribute(typeof _v === 'string' ? new LeafBuilder('identifier', _v) : _v);
    }
    return b;
  }
}
