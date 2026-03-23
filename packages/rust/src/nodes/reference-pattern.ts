import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ReferencePattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ReferencePatternBuilder extends BaseBuilder<ReferencePattern> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferencePattern {
    return {
      kind: 'reference_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ReferencePattern;
  }

  override get nodeKind(): string { return 'reference_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function reference_pattern(children: Child[]): ReferencePatternBuilder {
  return new ReferencePatternBuilder(children);
}
