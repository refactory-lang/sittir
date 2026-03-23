import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { NonNullExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class NonNullBuilder extends BaseBuilder<NonNullExpression> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('non null');
    if (this._children.length > 0) parts.push(this.renderChild(this._children[0]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): NonNullExpression {
    return {
      kind: 'non_null_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as NonNullExpression;
  }

  override get nodeKind(): string { return 'non_null_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'non null' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function non_null(children: Child): NonNullBuilder {
  return new NonNullBuilder(children);
}
