import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LiteralType } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class LiteralTypeBuilder extends BaseBuilder<LiteralType> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LiteralType {
    return {
      kind: 'literal_type',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as LiteralType;
  }

  override get nodeKind(): string { return 'literal_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function literal_type(children: Child): LiteralTypeBuilder {
  return new LiteralTypeBuilder(children);
}
