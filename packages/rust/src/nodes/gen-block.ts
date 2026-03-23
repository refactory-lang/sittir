import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenBlock } from '../types.js';


class GenBlockBuilder extends Builder<GenBlock> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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
      children: this._children[0]?.build(ctx),
    } as GenBlock;
  }

  override get nodeKind(): string { return 'gen_block'; }

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

export function gen_block(children: Builder): GenBlockBuilder {
  return new GenBlockBuilder(children);
}

export interface GenBlockOptions {
  children: Builder | (Builder)[];
}

export namespace gen_block {
  export function from(options: GenBlockOptions): GenBlockBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new GenBlockBuilder(_ctor);
    return b;
  }
}
