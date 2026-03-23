import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, EnumVariant, EnumVariantList } from '../types.js';


class EnumVariantListBuilder extends Builder<EnumVariantList> {
  private _children: Builder<AttributeItem | EnumVariant>[] = [];

  constructor() { super(); }

  children(...value: Builder<AttributeItem | EnumVariant>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    if (this._children[3]) parts.push(this.renderChild(this._children[3]!, ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumVariantList {
    return {
      kind: 'enum_variant_list',
      children: this._children.map(c => c.build(ctx)),
    } as EnumVariantList;
  }

  override get nodeKind(): string { return 'enum_variant_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    if (this._children[3]) parts.push({ kind: 'builder', builder: this._children[3]! });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { EnumVariantListBuilder };

export function enum_variant_list(): EnumVariantListBuilder {
  return new EnumVariantListBuilder();
}

export interface EnumVariantListOptions {
  children?: Builder<AttributeItem | EnumVariant> | (Builder<AttributeItem | EnumVariant>)[];
}

export namespace enum_variant_list {
  export function from(options: EnumVariantListOptions): EnumVariantListBuilder {
    const b = new EnumVariantListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
