import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TryBlock } from '../types.js';


class TryBlockBuilder extends BaseBuilder<TryBlock> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
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

export function try_block(children: BaseBuilder): TryBlockBuilder {
  return new TryBlockBuilder(children);
}
