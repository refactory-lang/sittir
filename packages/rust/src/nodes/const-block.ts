import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, ConstBlock } from '../types.js';


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

  override get nodeKind(): string { return 'const_block'; }

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
  body: Builder<Block>;
}

export namespace const_block {
  export function from(options: ConstBlockOptions): ConstBlockBuilder {
    const b = new ConstBlockBuilder(options.body);
    return b;
  }
}
