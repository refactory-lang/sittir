import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AccessibilityModifier, ComputedPropertyName, Decorator, Expression, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, PublicFieldDefinition, TypeAnnotation } from '../types.js';


class PublicFieldDefinitionBuilder extends Builder<PublicFieldDefinition> {
  private _decorator: Builder[] = [];
  private _name: Builder;
  private _type?: Builder;
  private _value?: Builder;
  private _children: Builder[] = [];

  constructor(name: Builder) {
    super();
    this._name = name;
  }

  decorator(...value: Builder[]): this {
    this._decorator = value;
    return this;
  }

  type(value: Builder): this {
    this._type = value;
    return this;
  }

  value(value: Builder): this {
    this._value = value;
    return this;
  }

  children(...value: Builder[]): this {
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
      decorator: this._decorator.map(c => this.renderChild(c, ctx)),
      name: this.renderChild(this._name, ctx),
      type: this._type ? this.renderChild(this._type, ctx) : undefined,
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as PublicFieldDefinition;
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

export function public_field_definition(name: Builder): PublicFieldDefinitionBuilder {
  return new PublicFieldDefinitionBuilder(name);
}

export interface PublicFieldDefinitionOptions {
  decorator?: Builder<Decorator> | (Builder<Decorator>)[];
  name: Builder<ComputedPropertyName | PrivatePropertyIdentifier | PropertyIdentifier>;
  type?: Builder<TypeAnnotation>;
  value?: Builder<Expression>;
  children?: Builder<AccessibilityModifier | OverrideModifier> | (Builder<AccessibilityModifier | OverrideModifier>)[];
}

export namespace public_field_definition {
  export function from(options: PublicFieldDefinitionOptions): PublicFieldDefinitionBuilder {
    const b = new PublicFieldDefinitionBuilder(options.name);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr);
    }
    if (options.type !== undefined) b.type(options.type);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
