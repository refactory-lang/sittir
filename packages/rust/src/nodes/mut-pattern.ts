import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { MutPattern } from '../types.js';


class MutPatternBuilder extends BaseBuilder<MutPattern> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function mut_pattern(children: BaseBuilder[]): MutPatternBuilder {
  return new MutPatternBuilder(children);
}
