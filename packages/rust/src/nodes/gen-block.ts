import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { GenBlock } from '../types.js';


class GenBlockBuilder extends BaseBuilder<GenBlock> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as GenBlock;
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

export function gen_block(children: BaseBuilder): GenBlockBuilder {
  return new GenBlockBuilder(children);
}
