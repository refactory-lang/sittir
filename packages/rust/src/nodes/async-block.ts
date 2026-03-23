import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsyncBlock, Block } from '../types.js';


class AsyncBlockBuilder extends Builder<AsyncBlock> {
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
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
      children: this._children[0]?.build(ctx),
    } as AsyncBlock;
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

export type { AsyncBlockBuilder };

export function async_block(children: Builder<Block>): AsyncBlockBuilder {
  return new AsyncBlockBuilder(children);
}

export interface AsyncBlockOptions {
  children: Builder<Block> | (Builder<Block>)[];
}

export namespace async_block {
  export function from(options: AsyncBlockOptions): AsyncBlockBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new AsyncBlockBuilder(_ctor);
    return b;
  }
}
