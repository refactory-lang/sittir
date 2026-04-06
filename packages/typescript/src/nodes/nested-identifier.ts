import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NestedIdentifier } from '../types.js';


class NestedIdentifierBuilder extends BaseBuilder<NestedIdentifier> {
  private _object: BaseBuilder;
  private _property!: BaseBuilder;

  constructor(object: BaseBuilder) {
    super();
    this._object = object;
  }

  property(value: BaseBuilder): this {
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
      object: this.renderChild(this._object, ctx),
      property: this._property ? this.renderChild(this._property, ctx) : undefined,
    } as unknown as NestedIdentifier;
  }

  override get nodeKind(): string { return 'nested_identifier'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._object) parts.push({ kind: 'builder', builder: this._object, fieldName: 'object' });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    return parts;
  }
}

export function nested_identifier(object: BaseBuilder): NestedIdentifierBuilder {
  return new NestedIdentifierBuilder(object);
}
