import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, GenBlock } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class GenBlockBuilder extends Builder<GenBlock> {
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('gen');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenBlock {
    return {
      kind: 'gen_block',
      children: this._children[0]!.build(ctx),
    } as GenBlock;
  }

  override get nodeKind(): 'gen_block' { return 'gen_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'gen', type: 'gen' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { GenBlockBuilder };

export function gen_block(children: Builder<Block>): GenBlockBuilder {
  return new GenBlockBuilder(children);
}

export interface GenBlockOptions {
  nodeKind: 'gen_block';
  children: Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[];
}

export namespace gen_block {
  export function from(input: Omit<GenBlockOptions, 'nodeKind'> | Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[]): GenBlockBuilder {
    const options: Omit<GenBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<GenBlockOptions, 'nodeKind'>
      : { children: input } as Omit<GenBlockOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new GenBlockBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    return b;
  }
}
