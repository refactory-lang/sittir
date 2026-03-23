import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, ComputedPropertyName, Decorator, Expression, Number, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, PublicFieldDefinition, String, TypeAnnotation } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';
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
      type: this._type?.build(ctx),
      value: this._value?.build(ctx),
      children: this._children.map(c => c.build(ctx)),
    } as PublicFieldDefinition;
  }

  override get nodeKind(): string { return 'public_field_definition'; }

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
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  type?: Builder<TypeAnnotation> | TypeAnnotationOptions;
  value?: Builder<Expression>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace public_field_definition {
  export function from(options: PublicFieldDefinitionOptions): PublicFieldDefinitionBuilder {
    const b = new PublicFieldDefinitionBuilder(options.name);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.type !== undefined) {
      const _v = options.type;
      b.type(_v instanceof Builder ? _v : type_annotation.from(_v as TypeAnnotationOptions));
    }
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
