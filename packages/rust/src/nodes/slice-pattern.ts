import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SlicePattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SlicePatternBuilder extends BaseBuilder<SlicePattern> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('slice');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SlicePattern {
    return {
      kind: 'slice_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SlicePattern;
  }

  override get nodeKind(): string { return 'slice_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'slice' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function slice_pattern(): SlicePatternBuilder {
  return new SlicePatternBuilder();
}
