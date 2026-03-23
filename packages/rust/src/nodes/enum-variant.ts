import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumVariant, Expression, FieldDeclarationList, Identifier, OrderedFieldDeclarationList, VisibilityModifier } from '../types.js';


class EnumVariantBuilder extends Builder<EnumVariant> {
  private _body?: Builder<FieldDeclarationList | OrderedFieldDeclarationList>;
  private _name: Builder<Identifier>;
  private _value?: Builder<Expression>;
  private _children: Builder<VisibilityModifier>[] = [];

  constructor(name: Builder<Identifier>) {
    super();
    this._name = name;
  }

  body(value: Builder<FieldDeclarationList | OrderedFieldDeclarationList>): this {
    this._body = value;
    return this;
  }

  value(value: Builder<Expression>): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<VisibilityModifier>[]): this {
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
      body: this._body?.build(ctx),
      name: this._name.build(ctx),
      value: this._value?.build(ctx),
      children: this._children[0]?.build(ctx),
    } as EnumVariant;
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

export type { EnumVariantBuilder };

export function enum_variant(name: Builder<Identifier>): EnumVariantBuilder {
  return new EnumVariantBuilder(name);
}

export interface EnumVariantOptions {
  body?: Builder<FieldDeclarationList | OrderedFieldDeclarationList>;
  name: Builder<Identifier> | string;
  value?: Builder<Expression>;
  children?: Builder<VisibilityModifier> | (Builder<VisibilityModifier>)[];
}

export namespace enum_variant {
  export function from(options: EnumVariantOptions): EnumVariantBuilder {
    const _ctor = options.name;
    const b = new EnumVariantBuilder(typeof _ctor === 'string' ? new LeafBuilder('identifier', _ctor) : _ctor);
    if (options.body !== undefined) b.body(options.body);
    if (options.value !== undefined) b.value(options.value);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
