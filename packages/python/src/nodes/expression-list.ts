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

  override get nodeKind(): 'expression_list' { return 'expression_list'; }

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
  nodeKind: 'expression_list';
  children?: Builder<Expression> | (Builder<Expression>)[];
}

export namespace expression_list {
  export function from(input: Omit<ExpressionListOptions, 'nodeKind'> | Builder<Expression> | (Builder<Expression>)[]): ExpressionListBuilder {
    const options: Omit<ExpressionListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ExpressionListOptions, 'nodeKind'>
      : { children: input } as Omit<ExpressionListOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ExpressionListBuilder(..._arr);
    return b;
  }
}
