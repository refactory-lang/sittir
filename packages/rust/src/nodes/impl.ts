import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ImplItem } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ImplBuilder extends BaseBuilder<ImplItem> {
  private _body?: Child;
  private _trait?: Child;
  private _type: Child;
  private _typeParameters?: Child;
  private _children: Child[] = [];

  constructor(type_: Child) {
    super();
    this._type = type_;
  }

  body(value: Child): this {
    this._body = value;
    return this;
  }

  trait(value: Child): this {
    this._trait = value;
    return this;
  }

  typeParameters(value: Child): this {
    this._typeParameters = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('impl');
    if (this._type) parts.push(this.renderChild(this._type, ctx));
    if (this._trait) parts.push(this.renderChild(this._trait, ctx), 'for');
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._body) {
      parts.push('{');
      parts.push(this.renderChild(this._body, ctx));
      parts.push('}');
    }
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
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
    parts.push({ kind: 'token', text: 'impl' });
    if (this._type) parts.push({ kind: 'builder', builder: this._type, fieldName: 'type' });
    if (this._trait) {
      parts.push({ kind: 'builder', builder: this._trait, fieldName: 'trait' });
      parts.push({ kind: 'token', text: 'for' });
    }
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._body) {
      parts.push({ kind: 'token', text: '{', type: '{' });
      parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
      parts.push({ kind: 'token', text: '}', type: '}' });
    }
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function impl(type_: Child): ImplBuilder {
  return new ImplBuilder(type_);
}
