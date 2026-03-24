import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, ReturnStatement } from '../types.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';


class ReturnStatementBuilder extends Builder<ReturnStatement> {
  private _children: Builder<Expression | ExpressionList>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | ExpressionList>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('return');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReturnStatement {
    return {
      kind: 'return_statement',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as ReturnStatement;
  }

  override get nodeKind(): 'return_statement' { return 'return_statement'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'return', type: 'return' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReturnStatementBuilder };

export function return_statement(): ReturnStatementBuilder {
  return new ReturnStatementBuilder();
}

export interface ReturnStatementOptions {
  nodeKind: 'return_statement';
  children?: Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'> | (Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'>)[];
}

export namespace return_statement {
  export function from(input: Omit<ReturnStatementOptions, 'nodeKind'> | Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'> | (Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'>)[]): ReturnStatementBuilder {
    const options: Omit<ReturnStatementOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ReturnStatementOptions, 'nodeKind'>
      : { children: input } as Omit<ReturnStatementOptions, 'nodeKind'>;
    const b = new ReturnStatementBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : expression_list.from(_x)));
    }
    return b;
  }
}
