import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsyncBlock } from '../types.js';


class AsyncBlockBuilder extends BaseBuilder<AsyncBlock> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('async');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    parts.push({ kind: 'token', text: 'async', type: 'async' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function async_block(children: BaseBuilder): AsyncBlockBuilder {
  return new AsyncBlockBuilder(children);
}
