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
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
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
