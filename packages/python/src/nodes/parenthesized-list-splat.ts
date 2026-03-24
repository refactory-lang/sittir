import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ListSplat, ParenthesizedExpression, ParenthesizedListSplat } from '../types.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { list_splat } from './list-splat.js';
import type { ListSplatOptions } from './list-splat.js';


class ParenthesizedListSplatBuilder extends Builder<ParenthesizedListSplat> {
  private _children: Builder<ParenthesizedExpression | ListSplat>[] = [];

  constructor(children: Builder<ParenthesizedExpression | ListSplat>) {
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
      children: this._children[0]!.build(ctx),
    } as ParenthesizedListSplat;
  }

  override get nodeKind(): 'parenthesized_list_splat' { return 'parenthesized_list_splat'; }

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

export function parenthesized_list_splat(children: Builder<ParenthesizedExpression | ListSplat>): ParenthesizedListSplatBuilder {
  return new ParenthesizedListSplatBuilder(children);
}

export interface ParenthesizedListSplatOptions {
  nodeKind: 'parenthesized_list_splat';
  children: Builder<ParenthesizedExpression | ListSplat> | ParenthesizedExpressionOptions | ListSplatOptions | (Builder<ParenthesizedExpression | ListSplat> | ParenthesizedExpressionOptions | ListSplatOptions)[];
}

export namespace parenthesized_list_splat {
  export function from(input: Omit<ParenthesizedListSplatOptions, 'nodeKind'> | Builder<ParenthesizedExpression | ListSplat> | ParenthesizedExpressionOptions | ListSplatOptions | (Builder<ParenthesizedExpression | ListSplat> | ParenthesizedExpressionOptions | ListSplatOptions)[]): ParenthesizedListSplatBuilder {
    const options: Omit<ParenthesizedListSplatOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ParenthesizedListSplatOptions, 'nodeKind'>
      : { children: input } as Omit<ParenthesizedListSplatOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<ParenthesizedExpression | ListSplat>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'parenthesized_expression': _resolved = parenthesized_expression.from(_ctor); break;
        case 'list_splat': _resolved = list_splat.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ParenthesizedListSplatBuilder(_resolved);
    return b;
  }
}
