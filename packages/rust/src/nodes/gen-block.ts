import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class GenBlockBuilder extends BaseBuilder<GenBlock> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): GenBlock {
    return {
      kind: 'gen_block',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as GenBlock;
  }

  override get nodeKind(): string { return 'gen_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function gen_block(children: Child): GenBlockBuilder {
  return new GenBlockBuilder(children);
}
