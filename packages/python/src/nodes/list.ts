import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, List, ListSplat, ParenthesizedListSplat } from '../types.js';


class ListBuilder extends Builder<List> {
  private _children: Builder<Expression | ListSplat | ParenthesizedListSplat>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | ListSplat | ParenthesizedListSplat>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): List {
    return {
      kind: 'list',
      children: this._children.map(c => c.build(ctx)),
    } as List;
  }

  override get nodeKind(): string { return 'list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { ListBuilder };

export function list(): ListBuilder {
  return new ListBuilder();
}

export interface ListOptions {
  children?: Builder<Expression | ListSplat | ParenthesizedListSplat> | (Builder<Expression | ListSplat | ParenthesizedListSplat>)[];
}

export namespace list {
  export function from(options: ListOptions): ListBuilder {
    const b = new ListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
