import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { InnerAttributeItem } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class InnerAttributeBuilder extends BaseBuilder<InnerAttributeItem> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('inner attribute');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): InnerAttributeItem {
    return {
      kind: 'inner_attribute_item',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as InnerAttributeItem;
  }

  override get nodeKind(): string { return 'inner_attribute_item'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'inner attribute' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function inner_attribute(children: Child): InnerAttributeBuilder {
  return new InnerAttributeBuilder(children);
}
