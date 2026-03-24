import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ListSplat, ParenthesizedListSplat, Tuple, Yield } from '../types.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';
import { list_splat } from './list-splat.js';
import type { ListSplatOptions } from './list-splat.js';
import { parenthesized_list_splat } from './parenthesized-list-splat.js';
import type { ParenthesizedListSplatOptions } from './parenthesized-list-splat.js';


class TupleBuilder extends Builder<Tuple> {
  private _children: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Tuple {
    return {
      kind: 'tuple',
      children: this._children.map(c => c.build(ctx)),
    } as Tuple;
  }

  override get nodeKind(): 'tuple' { return 'tuple'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { TupleBuilder };

export function tuple(): TupleBuilder {
  return new TupleBuilder();
}

export interface TupleOptions {
  nodeKind: 'tuple';
  children?: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions | (Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions)[];
}

export namespace tuple {
  export function from(input: Omit<TupleOptions, 'nodeKind'> | Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions | (Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions)[]): TupleBuilder {
    const options: Omit<TupleOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TupleOptions, 'nodeKind'>
      : { children: input } as Omit<TupleOptions, 'nodeKind'>;
    const b = new TupleBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'yield': return yield_.from(_v);   case 'list_splat': return list_splat.from(_v);   case 'parenthesized_list_splat': return parenthesized_list_splat.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
