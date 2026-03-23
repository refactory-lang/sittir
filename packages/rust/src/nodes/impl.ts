import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DeclarationList, GenericType, ImplItem, ScopedTypeIdentifier, Type, TypeIdentifier, TypeParameters, WhereClause } from '../types.js';


class ImplBuilder extends Builder<ImplItem> {
  private _body?: Builder;
  private _trait?: Builder;
  private _type: Builder;
  private _typeParameters?: Builder;
  private _children: Builder[] = [];

  constructor(type_: Builder) {
    super();
    this._type = type_;
  }

  body(value: Builder): this {
    this._body = value;
    return this;
  }

  trait(value: Builder): this {
    this._trait = value;
    return this;
  }

  typeParameters(value: Builder): this {
    this._typeParameters = value;
    return this;
  }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._trait) {
      parts.push('!');
      if (this._trait) parts.push(this.renderChild(this._trait, ctx));
      parts.push('for');
    }
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ImplItem {
    return {
      kind: 'impl_item',
      body: this._body ? this.renderChild(this._body, ctx) : undefined,
      trait: this._trait ? this.renderChild(this._trait, ctx) : undefined,
      type: this.renderChild(this._type, ctx),
      typeParameters: this._typeParameters ? this.renderChild(this._typeParameters, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ImplItem;
  }

  override get nodeKind(): string { return 'impl_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'impl', type: 'impl' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._trait) {
      parts.push({ kind: 'token', text: '!', type: '!' });
      if (this._trait) parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
      parts.push({ kind: 'token', text: 'for', type: 'for' });
    }
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ImplBuilder };

export function impl(type_: Builder): ImplBuilder {
  return new ImplBuilder(type_);
}

export interface ImplItemOptions {
  body?: Builder<DeclarationList>;
  trait?: Builder<GenericType | ScopedTypeIdentifier | TypeIdentifier>;
  type: Builder<Type>;
  typeParameters?: Builder<TypeParameters>;
  children?: Builder<WhereClause> | (Builder<WhereClause>)[];
}

export namespace impl {
  export function from(options: ImplItemOptions): ImplBuilder {
    const b = new ImplBuilder(options.type);
    if (options.body !== undefined) b.body(options.body);
    if (options.trait !== undefined) b.trait(options.trait);
    if (options.typeParameters !== undefined) b.typeParameters(options.typeParameters);
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
