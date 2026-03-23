import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TupleBuilder extends BaseBuilder<TupleExpression> {
  private _children: Child[] = [];

  constructor(children: Child[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('tuple');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleExpression {
    return {
      kind: 'tuple_expression',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TupleExpression;
  }

  override get nodeKind(): string { return 'tuple_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'tuple' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function tuple(children: Child[]): TupleBuilder {
  return new TupleBuilder(children);
}
