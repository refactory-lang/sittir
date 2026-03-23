import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RefPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RefPatternBuilder extends BaseBuilder<RefPattern> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('ref');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RefPattern {
    return {
      kind: 'ref_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RefPattern;
  }

  override get nodeKind(): string { return 'ref_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'ref' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function ref_pattern(children: Child): RefPatternBuilder {
  return new RefPatternBuilder(children);
}
