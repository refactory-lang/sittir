import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TryBlock } from '../types.js';


class TryBlockBuilder extends Builder<TryBlock> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TryBlock;
  }

  override get nodeKind(): string { return 'try_block'; }

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

export function try_block(children: Builder): TryBlockBuilder {
  return new TryBlockBuilder(children);
}

export interface TryBlockOptions {
  children: Builder | (Builder)[];
}

export namespace try_block {
  export function from(options: TryBlockOptions): TryBlockBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new TryBlockBuilder(_ctor);
    return b;
  }
}
