import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RestPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RestPatternBuilder extends BaseBuilder<RestPattern> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('...');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RestPattern {
    return {
      kind: 'rest_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RestPattern;
  }

  override get nodeKind(): string { return 'rest_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '...', type: '...' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function rest_pattern(children: Child): RestPatternBuilder {
  return new RestPatternBuilder(children);
}
