import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, ComputedPropertyName, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, PropertySignature, TypeAnnotation } from '../types.js';


class PropertySignatureBuilder extends Builder<PropertySignature> {
  private _name: Builder;
  private _type?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PropertySignature {
    return {
      kind: 'property_signature',
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as PropertySignature;
  }

  override get nodeKind(): string { return 'property_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    return parts;
  }
}

export type { PropertySignatureBuilder };

export function property_signature(name: Builder): PropertySignatureBuilder {
  return new PropertySignatureBuilder(name);
}

export interface PropertySignatureOptions {
  name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>;
  type?: Builder<TypeAnnotation>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace property_signature {
  export function from(options: PropertySignatureOptions): PropertySignatureBuilder {
    const b = new PropertySignatureBuilder(options.name);
    if (options.type !== undefined) b.type(options.type);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
