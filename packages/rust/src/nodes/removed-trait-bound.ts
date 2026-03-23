import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RemovedTraitBound, Type } from '../types.js';


class RemovedTraitBoundBuilder extends Builder<RemovedTraitBound> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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

export type { RemovedTraitBoundBuilder };

export function removed_trait_bound(children: Builder): RemovedTraitBoundBuilder {
  return new RemovedTraitBoundBuilder(children);
}

export interface RemovedTraitBoundOptions {
  children: Builder<Type> | (Builder<Type>)[];
}

export namespace removed_trait_bound {
  export function from(options: RemovedTraitBoundOptions): RemovedTraitBoundBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new RemovedTraitBoundBuilder(_ctor);
    return b;
  }
}
