import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { UnaryExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class UnaryBuilder extends BaseBuilder<UnaryExpression> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('-');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnaryExpression {
    return {
      kind: 'unary_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as UnaryExpression;
  }

  override get nodeKind(): string { return 'unary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '-', type: '-' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function unary(children: Child): UnaryBuilder {
  return new UnaryBuilder(children);
}
