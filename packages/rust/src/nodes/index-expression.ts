import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, IndexExpression } from '../types.js';


class IndexExpressionBuilder extends Builder<IndexExpression> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('[');
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): IndexExpression {
    return {
      kind: 'index_expression',
      children: this._children.map(c => c.build(ctx)),
    } as IndexExpression;
  }

  override get nodeKind(): string { return 'index_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '[', type: '[' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { IndexExpressionBuilder };

export function index_expression(...children: Builder<Expression>[]): IndexExpressionBuilder {
  return new IndexExpressionBuilder(...children);
}

export interface IndexExpressionOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace index_expression {
  export function from(options: IndexExpressionOptions): IndexExpressionBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new IndexExpressionBuilder(..._arr);
    return b;
  }
}
