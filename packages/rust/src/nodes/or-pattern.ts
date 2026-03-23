import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { OrPattern } from '../types.js';


class OrPatternBuilder extends BaseBuilder<OrPattern> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('|');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): OrPattern {
    return {
      kind: 'or_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as OrPattern;
  }

  override get nodeKind(): string { return 'or_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '|', type: '|' });
    return parts;
  }
}

export function or_pattern(children: BaseBuilder[]): OrPatternBuilder {
  return new OrPatternBuilder(children);
}
