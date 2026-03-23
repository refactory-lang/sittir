import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Expression, TupleExpression } from '../types.js';


class TupleExpressionBuilder extends Builder<TupleExpression> {
  private _children: Builder<Expression | AttributeItem>[] = [];

  constructor(...children: Builder<Expression | AttributeItem>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' , ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TupleExpression {
    return {
      kind: 'tuple_expression',
      children: this._children.map(c => c.build(ctx)),
    } as TupleExpression;
  }

  override get nodeKind(): string { return 'tuple_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { TupleExpressionBuilder };

export function tuple_expression(...children: Builder<Expression | AttributeItem>[]): TupleExpressionBuilder {
  return new TupleExpressionBuilder(...children);
}

export interface TupleExpressionOptions {
  children: Builder<Expression | AttributeItem> | (Builder<Expression | AttributeItem>)[];
}

export namespace tuple_expression {
  export function from(options: TupleExpressionOptions): TupleExpressionBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TupleExpressionBuilder(..._arr);
    return b;
  }
}
