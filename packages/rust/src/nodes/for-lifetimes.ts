import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ForLifetimes } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ForLifetimesBuilder extends BaseBuilder<ForLifetimes> {
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

  build(ctx?: RenderContext): ForLifetimes {
    return {
      kind: 'for_lifetimes',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ForLifetimes;
  }

  override get nodeKind(): string { return 'for_lifetimes'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function for_lifetimes(children: Child[]): ForLifetimesBuilder {
  return new ForLifetimesBuilder(children);
}
