import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CapturedPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class CapturedPatternBuilder extends BaseBuilder<CapturedPattern> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('captured');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CapturedPattern {
    return {
      kind: 'captured_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as CapturedPattern;
  }

  override get nodeKind(): string { return 'captured_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'captured' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function captured_pattern(children: Child[]): CapturedPatternBuilder {
  return new CapturedPatternBuilder(children);
}
