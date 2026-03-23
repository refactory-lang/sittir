import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SpreadElement } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SpreadElementBuilder extends BaseBuilder<SpreadElement> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SpreadElement {
    return {
      kind: 'spread_element',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SpreadElement;
  }

  override get nodeKind(): string { return 'spread_element'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function spread_element(children: Child): SpreadElementBuilder {
  return new SpreadElementBuilder(children);
}
