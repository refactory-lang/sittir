import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, TryBlock } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class TryBlockBuilder extends Builder<TryBlock> {
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('try');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryBlock {
    return {
      kind: 'try_block',
      children: this._children[0]!.build(ctx),
    } as TryBlock;
  }

  override get nodeKind(): 'try_block' { return 'try_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'try', type: 'try' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { TryBlockBuilder };

export function try_block(children: Builder<Block>): TryBlockBuilder {
  return new TryBlockBuilder(children);
}

export interface TryBlockOptions {
  nodeKind: 'try_block';
  children: Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[];
}

export namespace try_block {
  export function from(input: Omit<TryBlockOptions, 'nodeKind'> | Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[]): TryBlockBuilder {
    const options: Omit<TryBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TryBlockOptions, 'nodeKind'>
      : { children: input } as Omit<TryBlockOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TryBlockBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    return b;
  }
}
