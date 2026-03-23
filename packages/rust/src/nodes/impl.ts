import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImplItem } from '../types.js';


class ImplBuilder extends BaseBuilder<ImplItem> {
  private _body?: BaseBuilder;
  private _trait?: BaseBuilder;
  private _type: BaseBuilder;
  private _typeParameters?: BaseBuilder;
  private _children: BaseBuilder[] = [];

  constructor(type_: BaseBuilder) {
    super();
    this._type = type_;
  }

  body(value: BaseBuilder): this {
    this._body = value;
    return this;
  }

  trait(value: BaseBuilder): this {
    this._trait = value;
    return this;
  }

  typeParameters(value: BaseBuilder): this {
    this._typeParameters = value;
    return this;
  }

  children(value: BaseBuilder[]): this {
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

export function impl(type_: BaseBuilder): ImplBuilder {
  return new ImplBuilder(type_);
}
