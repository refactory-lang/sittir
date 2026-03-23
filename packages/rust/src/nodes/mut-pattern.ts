import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class MutPatternBuilder extends BaseBuilder<MutPattern> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('mut');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MutPattern {
    return {
      kind: 'mut_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as MutPattern;
  }

  override get nodeKind(): string { return 'mut_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'mut' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function mut_pattern(children: Child[]): MutPatternBuilder {
  return new MutPatternBuilder(children);
}
