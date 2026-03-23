import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AttributeItem, Expression, TupleExpression } from '../types.js';


class TupleBuilder extends Builder<TupleExpression> {
  private _children: Builder[] = [];

  constructor(...children: Builder[]) {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TupleExpression;
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

export type { TupleBuilder };

export function tuple(...children: Builder[]): TupleBuilder {
  return new TupleBuilder(...children);
}

export interface TupleExpressionOptions {
  children: Builder<Expression | AttributeItem> | (Builder<Expression | AttributeItem>)[];
}

export namespace tuple {
  export function from(options: TupleExpressionOptions): TupleBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new TupleBuilder(..._arr);
    return b;
  }
}
