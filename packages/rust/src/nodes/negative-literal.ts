import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NegativeLiteral } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NegativeLiteralBuilder extends BaseBuilder<NegativeLiteral> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('negative');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NegativeLiteral {
    return {
      kind: 'negative_literal',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NegativeLiteral;
  }

  override get nodeKind(): string { return 'negative_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'negative' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function negative_literal(children: Child): NegativeLiteralBuilder {
  return new NegativeLiteralBuilder(children);
}
