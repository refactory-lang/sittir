import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TraitBounds } from '../types.js';


class TraitBoundsBuilder extends BaseBuilder<TraitBounds> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    parts.push({ kind: 'token', text: ':', type: ':' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function trait_bounds(children: BaseBuilder[]): TraitBoundsBuilder {
  return new TraitBoundsBuilder(children);
}
