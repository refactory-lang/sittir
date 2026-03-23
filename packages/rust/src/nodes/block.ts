import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Block, DeclarationStatement, Expression, ExpressionStatement, Label } from '../types.js';


class BlockBuilder extends Builder<Block> {
  private _children: Builder<DeclarationStatement | Expression | ExpressionStatement | Label>[] = [];

  constructor() { super(); }

  children(...value: Builder<DeclarationStatement | Expression | ExpressionStatement | Label>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('{');
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Block {
    return {
      kind: 'block',
      children: this._children.map(c => c.build(ctx)),
    } as Block;
  }

  override get nodeKind(): string { return 'block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '{', type: '{' });
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { BlockBuilder };

export function block(): BlockBuilder {
  return new BlockBuilder();
}

export interface BlockOptions {
  children?: Builder<DeclarationStatement | Expression | ExpressionStatement | Label> | (Builder<DeclarationStatement | Expression | ExpressionStatement | Label>)[];
}

export namespace block {
  export function from(options: BlockOptions): BlockBuilder {
    const b = new BlockBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
