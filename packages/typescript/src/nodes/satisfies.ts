import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { SatisfiesExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class SatisfiesBuilder extends BaseBuilder<SatisfiesExpression> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('satisfies');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): SatisfiesExpression {
    return {
      kind: 'satisfies_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as SatisfiesExpression;
  }

  override get nodeKind(): string { return 'satisfies_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'satisfies', type: 'satisfies' });
    return parts;
  }
}

export function satisfies(children: Child[]): SatisfiesBuilder {
  return new SatisfiesBuilder(children);
}
