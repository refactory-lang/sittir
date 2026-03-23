import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ComputedPropertyName, Decorator, Expression, FieldDefinition, Number, PrivatePropertyIdentifier, PropertyIdentifier, String } from '../types.js';
import { decorator } from './decorator.js';
import type { DecoratorOptions } from './decorator.js';


class FieldDefinitionBuilder extends Builder<FieldDefinition> {
  private _decorator: Builder<Decorator>[] = [];
  private _property: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _value?: Builder<Expression>;

  constructor(property: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._property = property;
  }

  decorator(...value: Builder<Decorator>[]): this {
    this._decorator = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._property) parts.push(this.renderChild(this._property, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): FieldDefinition {
    return {
      kind: 'field_definition',
      decorator: this._decorator.map(c => c.build(ctx)),
      property: this._property.build(ctx),
      value: this._value?.build(ctx),
    } as FieldDefinition;
  }

  override get nodeKind(): string { return 'field_definition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._decorator) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'decorator' });
    }
    if (this._property) parts.push({ kind: 'builder', builder: this._property, fieldName: 'property' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export type { FieldDefinitionBuilder };

export function field_definition(property: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): FieldDefinitionBuilder {
  return new FieldDefinitionBuilder(property);
}

export interface FieldDefinitionOptions {
  decorator?: Builder<Decorator> | DecoratorOptions | (Builder<Decorator> | DecoratorOptions)[];
  property: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  value?: Builder<Expression>;
}

export namespace field_definition {
  export function from(options: FieldDefinitionOptions): FieldDefinitionBuilder {
    const b = new FieldDefinitionBuilder(options.property);
    if (options.decorator !== undefined) {
      const _v = options.decorator;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.decorator(..._arr.map(_v => _v instanceof Builder ? _v : decorator.from(_v as DecoratorOptions)));
    }
    if (options.value !== undefined) b.value(options.value);
    return b;
  }
}
