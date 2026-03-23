import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnsafeBlock } from '../types.js';


class UnsafeBlockBuilder extends BaseBuilder<UnsafeBlock> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UnsafeBlock;
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

export function unsafe_block(children: BaseBuilder): UnsafeBlockBuilder {
  return new UnsafeBlockBuilder(children);
}
