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
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function spread_element(children: Child): SpreadElementBuilder {
  return new SpreadElementBuilder(children);
}
