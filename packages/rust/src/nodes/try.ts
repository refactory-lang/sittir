import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TryExpression } from '../types.js';


class TryBuilder extends BaseBuilder<TryExpression> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('?');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TryExpression {
    return {
      kind: 'try_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TryExpression;
  }

  override get nodeKind(): string { return 'try_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '?', type: '?' });
    return parts;
  }
}

export function try_(children: BaseBuilder): TryBuilder {
  return new TryBuilder(children);
}
