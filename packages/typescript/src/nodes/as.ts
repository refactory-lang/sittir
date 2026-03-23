import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AsBuilder extends BaseBuilder<AsExpression> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('as');
    parts.push('const');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AsExpression {
    return {
      kind: 'as_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as AsExpression;
  }

  override get nodeKind(): string { return 'as_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: 'as', type: 'as' });
    parts.push({ kind: 'token', text: 'const', type: 'const' });
    return parts;
  }
}

export function as(children: Child[]): AsBuilder {
  return new AsBuilder(children);
}
