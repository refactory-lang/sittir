import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ListSplat, ParenthesizedExpression, ParenthesizedListSplat } from '../types.js';


class ParenthesizedListSplatBuilder extends Builder<ParenthesizedListSplat> {
  private _children: Builder<ListSplat | ParenthesizedExpression>[] = [];

  constructor(children: Builder<ListSplat | ParenthesizedExpression>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ParenthesizedListSplat {
    return {
      kind: 'parenthesized_list_splat',
      children: this._children[0]?.build(ctx),
    } as ParenthesizedListSplat;
  }

  override get nodeKind(): string { return 'parenthesized_list_splat'; }

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

export type { ParenthesizedListSplatBuilder };

export function parenthesized_list_splat(children: Builder<ListSplat | ParenthesizedExpression>): ParenthesizedListSplatBuilder {
  return new ParenthesizedListSplatBuilder(children);
}

export interface ParenthesizedListSplatOptions {
  children: Builder<ListSplat | ParenthesizedExpression> | (Builder<ListSplat | ParenthesizedExpression>)[];
}

export namespace parenthesized_list_splat {
  export function from(options: ParenthesizedListSplatOptions): ParenthesizedListSplatBuilder {
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    const b = new ParenthesizedListSplatBuilder(_ctor);
    return b;
  }
}
