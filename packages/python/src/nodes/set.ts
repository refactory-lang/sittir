import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ListSplat, ParenthesizedListSplat, Set } from '../types.js';


class SetBuilder extends Builder<Set> {
  private _children: Builder<Expression | ListSplat | ParenthesizedListSplat>[] = [];

  constructor(...children: Builder<Expression | ListSplat | ParenthesizedListSplat>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Set {
    return {
      kind: 'set',
      children: this._children.map(c => c.build(ctx)),
    } as Set;
  }

  override get nodeKind(): string { return 'set'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { SetBuilder };

export function set(...children: Builder<Expression | ListSplat | ParenthesizedListSplat>[]): SetBuilder {
  return new SetBuilder(...children);
}

export interface SetOptions {
  children: Builder<Expression | ListSplat | ParenthesizedListSplat> | (Builder<Expression | ListSplat | ParenthesizedListSplat>)[];
}

export namespace set {
  export function from(options: SetOptions): SetBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new SetBuilder(..._arr);
    return b;
  }
}
