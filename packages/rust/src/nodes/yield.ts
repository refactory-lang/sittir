import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { YieldExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class YieldBuilder extends BaseBuilder<YieldExpression> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('yield');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): YieldExpression {
    return {
      kind: 'yield_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as YieldExpression;
  }

  override get nodeKind(): string { return 'yield_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'yield', type: 'yield' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function yield_(): YieldBuilder {
  return new YieldBuilder();
}
