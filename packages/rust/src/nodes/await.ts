import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AwaitExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AwaitBuilder extends BaseBuilder<AwaitExpression> {
  private _children: Child[] = [];

  constructor(children: Child) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('.');
    parts.push('await');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AwaitExpression {
    return {
      kind: 'await_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AwaitExpression;
  }

  override get nodeKind(): string { return 'await_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '.', type: '.' });
    parts.push({ kind: 'token', text: 'await', type: 'await' });
    return parts;
  }
}

export function await_(children: Child): AwaitBuilder {
  return new AwaitBuilder(children);
}
