import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Expression, ListSplat, ParenthesizedListSplat, Set, Yield } from '../types.js';
import { yield_ } from './yield.js';
import type { YieldOptions } from './yield.js';
import { list_splat } from './list-splat.js';
import type { ListSplatOptions } from './list-splat.js';
import { parenthesized_list_splat } from './parenthesized-list-splat.js';
import type { ParenthesizedListSplatOptions } from './parenthesized-list-splat.js';


class SetBuilder extends Builder<Set> {
  private _children: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat>[] = [];

  constructor(...children: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat>[]) {
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

  override get nodeKind(): 'set' { return 'set'; }

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

export function set(...children: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat>[]): SetBuilder {
  return new SetBuilder(...children);
}

export interface SetOptions {
  nodeKind: 'set';
  children?: Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions | (Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions)[];
}

export namespace set {
  export function from(input: Omit<SetOptions, 'nodeKind'> | Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions | (Builder<Expression | Yield | ListSplat | ParenthesizedListSplat> | YieldOptions | ListSplatOptions | ParenthesizedListSplatOptions)[]): SetBuilder {
    const options: Omit<SetOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<SetOptions, 'nodeKind'>
      : { children: input } as Omit<SetOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new SetBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'yield': return yield_.from(_v);   case 'list_splat': return list_splat.from(_v);   case 'parenthesized_list_splat': return parenthesized_list_splat.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
