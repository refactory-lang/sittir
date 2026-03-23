import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NestedIdentifier } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NestedIdentifierBuilder extends BaseBuilder<NestedIdentifier> {
  private _object: Child;
  private _property!: Child;

  constructor(object: Child) {
    super();
    this._object = object;
  }

  property(value: Child): this {
    this._property = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._object) parts.push(this.renderChild(this._object, ctx));
    if (this._property) parts.push(this.renderChild(this._property, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NestedIdentifier {
    return {
      kind: 'nested_identifier',
      object: this.renderChild(this._object, ctx),
      property: this._property ? this.renderChild(this._property, ctx) : undefined,
    } as unknown as NestedIdentifier;
  }

  override get nodeKind(): string { return 'nested_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    return parts;
  }
}

export function nested_identifier(object: Child): NestedIdentifierBuilder {
  return new NestedIdentifierBuilder(object);
}
