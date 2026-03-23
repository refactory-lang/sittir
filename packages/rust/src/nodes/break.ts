import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BreakExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class BreakBuilder extends BaseBuilder<BreakExpression> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('break');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BreakExpression {
    return {
      kind: 'break_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as BreakExpression;
  }

  override get nodeKind(): string { return 'break_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'break' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function break_(): BreakBuilder {
  return new BreakBuilder();
}
