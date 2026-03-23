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
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function removed_trait_bound(children: Child): RemovedTraitBoundBuilder {
  return new RemovedTraitBoundBuilder(children);
}
