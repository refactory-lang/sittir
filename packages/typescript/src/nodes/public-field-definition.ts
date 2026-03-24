import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { AccessibilityModifier, ComputedPropertyName, Decorator, Expression, Number, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, PublicFieldDefinition, String, TypeAnnotation } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { computed_property_name } from './computed-property-name.js';
import type { ComputedPropertyNameOptions } from './computed-property-name.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';


class PublicFieldDefinitionBuilder extends Builder<PublicFieldDefinition> {
  private _decorator: Builder<Decorator>[] = [];
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _type?: Builder<TypeAnnotation>;
  private _value?: Builder<Expression>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._name = name;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  type(value: Builder<TypeAnnotation>): this {
    this._type = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<AccessibilityModifier | OverrideModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): PublicFieldDefinition {
    return {
      kind: 'public_field_definition',
      decorator: this._decorator.map(c => c.build(ctx)),
      name: this._name.build(ctx),
      type: this._type ? this._type.build(ctx) : undefined,
      value: this._value ? this._value.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as PublicFieldDefinition;
  }

  override get nodeKind(): 'public_field_definition' { return 'public_field_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { PublicFieldDefinitionBuilder };

export function public_field_definition(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): PublicFieldDefinitionBuilder {
  return new PublicFieldDefinitionBuilder(name);
}

export interface PublicFieldDefinitionOptions {
  nodeKind: 'public_field_definition';
  decorator?: Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'> | (Builder<Decorator> | Omit<DecoratorOptions, 'nodeKind'>)[];
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | StringOptions | ComputedPropertyNameOptions;
  type?: Builder<TypeAnnotation> | Omit<TypeAnnotationOptions, 'nodeKind'>;
  value?: Builder<Expression>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'> | (Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'>)[];
}

export namespace public_field_definition {
  export function from(options: Omit<PublicFieldDefinitionOptions, 'nodeKind'>): PublicFieldDefinitionBuilder {
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
    const b = new PublicFieldDefinitionBuilder(_ctor);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v)));
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v));
    }
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'accessibility_modifier': return new LeafBuilder('accessibility_modifier', (_v as LeafOptions).text!);   case 'override_modifier': return new LeafBuilder('override_modifier', (_v as LeafOptions).text ?? 'override'); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
