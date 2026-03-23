import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnsafeBlock } from '../types.js';


class UnsafeBlockBuilder extends Builder<UnsafeBlock> {
  private _children: Builder[] = [];

  constructor(children: Builder) {
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
      children: this._children[0]?.build(ctx),
    } as UnsafeBlock;
  }

  override get nodeKind(): string { return 'unsafe_block'; }

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

export function unsafe_block(children: Builder): UnsafeBlockBuilder {
  return new UnsafeBlockBuilder(children);
}

export interface UnsafeBlockOptions {
  children: Builder | (Builder)[];
}

export namespace unsafe_block {
  export function from(options: UnsafeBlockOptions): UnsafeBlockBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new UnsafeBlockBuilder(_ctor);
    return b;
  }
}
