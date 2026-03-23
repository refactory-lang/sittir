import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ListSplat, ParenthesizedListSplat, Tuple } from '../types.js';


class TupleBuilder extends Builder<Tuple> {
  private _children: Builder<Expression | ListSplat | ParenthesizedListSplat>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | ListSplat | ParenthesizedListSplat>[]): this {
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

  override get nodeKind(): string { return 'tuple'; }

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
  children?: Builder<Expression | ListSplat | ParenthesizedListSplat> | (Builder<Expression | ListSplat | ParenthesizedListSplat>)[];
}

export namespace tuple {
  export function from(options: TupleOptions): TupleBuilder {
    const b = new TupleBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
