import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumVariantList } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class EnumVariantListBuilder extends BaseBuilder<EnumVariantList> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): EnumVariantList {
    return {
      kind: 'enum_variant_list',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as EnumVariantList;
  }

  override get nodeKind(): string { return 'enum_variant_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function enum_variant_list(): EnumVariantListBuilder {
  return new EnumVariantListBuilder();
}
