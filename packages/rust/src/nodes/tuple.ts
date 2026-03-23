import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TupleExpression } from '../types.js';


class TupleBuilder extends BaseBuilder<TupleExpression> {
  private _children: BaseBuilder[] = [];

  constructor(children: BaseBuilder[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(',');
    parts.push(')');
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
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ',', type: ',' });
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export function tuple(children: BaseBuilder[]): TupleBuilder {
  return new TupleBuilder(children);
}
