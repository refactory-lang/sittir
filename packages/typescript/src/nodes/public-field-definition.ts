import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { PublicFieldDefinition } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class PublicFieldDefinitionBuilder extends BaseBuilder<PublicFieldDefinition> {
  private _decorator: Child[] = [];
  private _name: Child;
  private _type?: Child;
  private _value?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  decorator(value: Child[]): this {
    this._decorator = value;
    return this;
  }

  type(value: Child): this {
    this._type = value;
    return this;
  }

  value(value: Child): this {
    this._value = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._decorator.length > 0) parts.push(this.renderChildren(this._decorator, ', ', ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export function public_field_definition(name: Child): PublicFieldDefinitionBuilder {
  return new PublicFieldDefinitionBuilder(name);
}
