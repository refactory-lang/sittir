import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { HigherRankedTraitBound, TraitBounds, Type } from '../types.js';


class TraitBoundsBuilder extends Builder<TraitBounds> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push(':');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' + ', ctx));
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
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: '+', type: '+' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    return parts;
  }
}

export type { TraitBoundsBuilder };

export function trait_bounds(...children: Builder[]): TraitBoundsBuilder {
  return new TraitBoundsBuilder(...children);
}

export interface TraitBoundsOptions {
  children: Builder<Type | HigherRankedTraitBound> | (Builder<Type | HigherRankedTraitBound>)[];
}

export namespace trait_bounds {
  export function from(options: TraitBoundsOptions): TraitBoundsBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TraitBoundsBuilder(..._arr);
    return b;
  }
}
