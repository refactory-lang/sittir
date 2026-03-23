import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LetChain } from '../types.js';


class LetChainBuilder extends BaseBuilder<LetChain> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    return this._children ? this.renderChildren(this._children, ' ', ctx) : '';
  }

  build(ctx?: RenderContext): LetChain {
    return {
      kind: 'let_chain',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LetChain;
  }

  override get nodeKind(): string { return 'let_chain'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function let_chain(children: BaseBuilder[]): LetChainBuilder {
  return new LetChainBuilder(children);
}
