import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RawStringLiteral } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RawStringLiteralBuilder extends BaseBuilder<RawStringLiteral> {
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

  build(ctx?: RenderContext): RawStringLiteral {
    return {
      kind: 'raw_string_literal',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RawStringLiteral;
  }

  override get nodeKind(): string { return 'raw_string_literal'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function raw_string_literal(children: Child): RawStringLiteralBuilder {
  return new RawStringLiteralBuilder(children);
}
