import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RemovedTraitBound } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RemovedTraitBoundBuilder extends BaseBuilder<RemovedTraitBound> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('?');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RemovedTraitBound {
    return {
      kind: 'removed_trait_bound',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RemovedTraitBound;
  }

  override get nodeKind(): string { return 'removed_trait_bound'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '?', type: '?' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function removed_trait_bound(children: Child): RemovedTraitBoundBuilder {
  return new RemovedTraitBoundBuilder(children);
}
