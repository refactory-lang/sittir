import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { AccessibilityModifier, ComputedPropertyName, Number, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, PropertySignature, String, TypeAnnotation } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { computed_property_name } from './computed-property-name.js';
import type { ComputedPropertyNameOptions } from './computed-property-name.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class PropertySignatureBuilder extends Builder<PropertySignature> {
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _type?: Builder<TypeAnnotation>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._name = name;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  children(...value: Builder<AccessibilityModifier | OverrideModifier>[]): this {
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
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as PropertySignature;
  }

  override get nodeKind(): 'property_signature' { return 'property_signature'; }

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

export function property_signature(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): PropertySignatureBuilder {
  return new PropertySignatureBuilder(name);
}

export interface PropertySignatureOptions {
  nodeKind: 'property_signature';
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | StringOptions | ComputedPropertyNameOptions;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'> | (Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'>)[];
}

export namespace property_signature {
  export function from(options: Omit<PropertySignatureOptions, 'nodeKind'>): PropertySignatureBuilder {
    const _raw = options.name;
    let _ctor: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string': _ctor = string.from(_raw); break;
        case 'computed_property_name': _ctor = computed_property_name.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new PropertySignatureBuilder(_ctor);
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'accessibility_modifier': return new LeafBuilder('accessibility_modifier', (_v as LeafOptions).text!);   case 'override_modifier': return new LeafBuilder('override_modifier', (_v as LeafOptions).text ?? 'override'); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
