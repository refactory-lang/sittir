import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumVariant } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class EnumVariantBuilder extends BaseBuilder<EnumVariant> {
  private _body?: Child;
  private _name: Child;
  private _value?: Child;
  private _children: Child[] = [];

  constructor(name: Child) {
    super();
    this._name = name;
  }

  body(value: Child): this {
    this._body = value;
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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    if (this._value) {
      parts.push('=');
      if (this._value) parts.push(this.renderChild(this._value, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumVariant {
    return {
      kind: 'enum_variant',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      name: this.renderChild(this._name, ctx),
      value: this._value ? this.renderChild(this._value, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as EnumVariant;
  }

  override get nodeKind(): string { return 'enum_variant'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    if (this._value) {
      parts.push({ kind: 'token', text: '=', type: '=' });
      if (this._value) parts.push({ kind: 'builder', builder: this._value, fieldName: 'value' });
    }
    return parts;
  }
}

export function enum_variant(name: Child): EnumVariantBuilder {
  return new EnumVariantBuilder(name);
}
