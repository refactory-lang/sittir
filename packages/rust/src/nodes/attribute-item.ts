import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AttributeBuilder extends BaseBuilder<AttributeItem> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('attribute');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AttributeItem {
    return {
      kind: 'attribute_item',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AttributeItem;
  }

  override get nodeKind(): string { return 'attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'attribute' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function attribute(children: Child): AttributeBuilder {
  return new AttributeBuilder(children);
}
