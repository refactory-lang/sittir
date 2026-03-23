import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TraitBounds } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TraitBoundsBuilder extends BaseBuilder<TraitBounds> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TraitBounds {
    return {
      kind: 'trait_bounds',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TraitBounds;
  }

  override get nodeKind(): string { return 'trait_bounds'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function trait_bounds(children: Child[]): TraitBoundsBuilder {
  return new TraitBoundsBuilder(children);
}
