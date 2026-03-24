import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, EnumVariant, EnumVariantList } from '../types.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { enum_variant } from './enum-variant.js';
import type { EnumVariantOptions } from './enum-variant.js';


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

  override get nodeKind(): 'enum_variant_list' { return 'enum_variant_list'; }

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
  nodeKind: 'enum_variant_list';
  children?: Builder<AttributeItem | EnumVariant> | AttributeItemOptions | EnumVariantOptions | (Builder<AttributeItem | EnumVariant> | AttributeItemOptions | EnumVariantOptions)[];
}

export namespace enum_variant_list {
  export function from(input: Omit<EnumVariantListOptions, 'nodeKind'> | Builder<AttributeItem | EnumVariant> | AttributeItemOptions | EnumVariantOptions | (Builder<AttributeItem | EnumVariant> | AttributeItemOptions | EnumVariantOptions)[]): EnumVariantListBuilder {
    const options: Omit<EnumVariantListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<EnumVariantListOptions, 'nodeKind'>
      : { children: input } as Omit<EnumVariantListOptions, 'nodeKind'>;
    const b = new EnumVariantListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'attribute_item': return attribute.from(_v);   case 'enum_variant': return enum_variant.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
