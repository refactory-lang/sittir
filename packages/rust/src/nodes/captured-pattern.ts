import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CapturedPattern } from '../types.js';


class CapturedPatternBuilder extends BaseBuilder<CapturedPattern> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('@');
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
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '@', type: '@' });
    return parts;
  }
}

export function captured_pattern(children: BaseBuilder[]): CapturedPatternBuilder {
  return new CapturedPatternBuilder(children);
}
