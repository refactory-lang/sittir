import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ExpressionList, Yield } from '../types.js';
import { expression_list } from './expression-list.js';
import type { ExpressionListOptions } from './expression-list.js';


class YieldBuilder extends Builder<Yield> {
  private _children: Builder<Expression | ExpressionList>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | ExpressionList>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('yield');
    parts.push('from');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Yield {
    return {
      kind: 'yield',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as Yield;
  }

  override get nodeKind(): 'yield' { return 'yield'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'yield', type: 'yield' });
    parts.push({ kind: 'token', text: 'from', type: 'from' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { YieldBuilder };

export function yield_(): YieldBuilder {
  return new YieldBuilder();
}

export interface YieldOptions {
  nodeKind: 'yield';
  children?: Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'> | (Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'>)[];
}

export namespace yield_ {
  export function from(input: Omit<YieldOptions, 'nodeKind'> | Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'> | (Builder<Expression | ExpressionList> | Omit<ExpressionListOptions, 'nodeKind'>)[]): YieldBuilder {
    const options: Omit<YieldOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<YieldOptions, 'nodeKind'>
      : { children: input } as Omit<YieldOptions, 'nodeKind'>;
    const b = new YieldBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : expression_list.from(_x)));
    }
    return b;
  }
}
