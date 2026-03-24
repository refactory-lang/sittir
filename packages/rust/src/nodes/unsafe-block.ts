import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, UnsafeBlock } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class UnsafeBlockBuilder extends Builder<UnsafeBlock> {
  private _children: Builder<Block>[] = [];

  constructor(children: Builder<Block>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('unsafe');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnsafeBlock {
    return {
      kind: 'unsafe_block',
      children: this._children[0]!.build(ctx),
    } as UnsafeBlock;
  }

  override get nodeKind(): 'unsafe_block' { return 'unsafe_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'unsafe', type: 'unsafe' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { UnsafeBlockBuilder };

export function unsafe_block(children: Builder<Block>): UnsafeBlockBuilder {
  return new UnsafeBlockBuilder(children);
}

export interface UnsafeBlockOptions {
  nodeKind: 'unsafe_block';
  children: Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[];
}

export namespace unsafe_block {
  export function from(input: Omit<UnsafeBlockOptions, 'nodeKind'> | Builder<Block> | Omit<BlockOptions, 'nodeKind'> | (Builder<Block> | Omit<BlockOptions, 'nodeKind'>)[]): UnsafeBlockBuilder {
    const options: Omit<UnsafeBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UnsafeBlockOptions, 'nodeKind'>
      : { children: input } as Omit<UnsafeBlockOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new UnsafeBlockBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    return b;
  }
}
