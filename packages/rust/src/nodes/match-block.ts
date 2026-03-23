import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MatchBlock } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MatchBlockBuilder extends BaseBuilder<MatchBlock> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MatchBlock {
    return {
      kind: 'match_block',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MatchBlock;
  }

  override get nodeKind(): string { return 'match_block'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function match_block(): MatchBlockBuilder {
  return new MatchBlockBuilder();
}
