import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsyncBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AsyncBlockBuilder extends BaseBuilder<AsyncBlock> {
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

  build(ctx?: RenderContext): AsyncBlock {
    return {
      kind: 'async_block',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AsyncBlock;
  }

  override get nodeKind(): string { return 'async_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function async_block(children: Child): AsyncBlockBuilder {
  return new AsyncBlockBuilder(children);
}
