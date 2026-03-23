import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RangeExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RangeBuilder extends BaseBuilder<RangeExpression> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('..');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RangeExpression {
    return {
      kind: 'range_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as RangeExpression;
  }

  override get nodeKind(): string { return 'range_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '..', type: '..' });
    return parts;
  }
}

export function range(): RangeBuilder {
  return new RangeBuilder();
}
