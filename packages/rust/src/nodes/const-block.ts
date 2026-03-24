import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ConstBlock } from '../types.js';
import { block } from './block.js';
import type { BlockOptions } from './block.js';


class ConstBlockBuilder extends Builder<ConstBlock> {
  private _body: Builder<Block>;

  constructor(body: Builder<Block>) {
    super();
    this._body = body;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('const');
    if (this._body) parts.push(this.renderChild(this._body, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConstBlock {
    return {
      kind: 'const_block',
      body: this._body.build(ctx),
    } as ConstBlock;
  }

  override get nodeKind(): 'const_block' { return 'const_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    if (this._body) parts.push({ kind: 'builder', builder: this._body, fieldName: 'body' });
    return parts;
  }
}

export type { ConstBlockBuilder };

export function const_block(body: Builder<Block>): ConstBlockBuilder {
  return new ConstBlockBuilder(body);
}

export interface ConstBlockOptions {
  nodeKind: 'const_block';
  body: Builder<Block> | Omit<BlockOptions, 'nodeKind'>;
}

export namespace const_block {
  export function from(input: Omit<ConstBlockOptions, 'nodeKind'> | Builder<Block> | Omit<BlockOptions, 'nodeKind'>): ConstBlockBuilder {
    const options: Omit<ConstBlockOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'body' in input
      ? input as Omit<ConstBlockOptions, 'nodeKind'>
      : { body: input } as Omit<ConstBlockOptions, 'nodeKind'>;
    const _ctor = options.body;
    const b = new ConstBlockBuilder(_ctor instanceof Builder ? _ctor : block.from(_ctor));
    return b;
  }
}
