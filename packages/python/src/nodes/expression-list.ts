import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList } from '../types.js';


class ExpressionListBuilder extends Builder<ExpressionList> {
  private _children: Builder<Expression>[] = [];

  constructor(...children: Builder<Expression>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(',');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ExpressionList {
    return {
      kind: 'expression_list',
      children: this._children.map(c => c.build(ctx)),
    } as ExpressionList;
  }

  override get nodeKind(): string { return 'expression_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ',', type: ',' });
    return parts;
  }
}

export type { ExpressionListBuilder };

export function expression_list(...children: Builder<Expression>[]): ExpressionListBuilder {
  return new ExpressionListBuilder(...children);
}

export interface ExpressionListOptions {
  children: Builder<Expression> | (Builder<Expression>)[];
}

export namespace expression_list {
  export function from(options: ExpressionListOptions): ExpressionListBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ExpressionListBuilder(..._arr);
    return b;
  }
}
