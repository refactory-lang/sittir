import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { EnumVariantList } from '../types.js';


class EnumVariantListBuilder extends BaseBuilder<EnumVariantList> {
  private _children: BaseBuilder[] = [];

  constructor() { super(); }

  children(value: BaseBuilder[]): this {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as EnumVariantList;
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

export function enum_variant_list(): EnumVariantListBuilder {
  return new EnumVariantListBuilder();
}
