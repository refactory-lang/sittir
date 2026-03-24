import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, DictionarySplat, Expression, KeywordArgument, ListSplat, ParenthesizedExpression } from '../types.js';
import { list_splat } from './list-splat.js';
import type { ListSplatOptions } from './list-splat.js';
import { dictionary_splat } from './dictionary-splat.js';
import type { DictionarySplatOptions } from './dictionary-splat.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { keyword_argument } from './keyword-argument.js';
import type { KeywordArgumentOptions } from './keyword-argument.js';


class ArgumentListBuilder extends Builder<ArgumentList> {
  private _children: Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument>[] = [];

  constructor() { super(); }

  children(...value: Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArgumentList {
    return {
      kind: 'argument_list',
      children: this._children.map(c => c.build(ctx)),
    } as ArgumentList;
  }

  override get nodeKind(): 'argument_list' { return 'argument_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { ArgumentListBuilder };

export function argument_list(): ArgumentListBuilder {
  return new ArgumentListBuilder();
}

export interface ArgumentListOptions {
  nodeKind: 'argument_list';
  children?: Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument> | ListSplatOptions | DictionarySplatOptions | ParenthesizedExpressionOptions | KeywordArgumentOptions | (Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument> | ListSplatOptions | DictionarySplatOptions | ParenthesizedExpressionOptions | KeywordArgumentOptions)[];
}

export namespace argument_list {
  export function from(input: Omit<ArgumentListOptions, 'nodeKind'> | Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument> | ListSplatOptions | DictionarySplatOptions | ParenthesizedExpressionOptions | KeywordArgumentOptions | (Builder<Expression | ListSplat | DictionarySplat | ParenthesizedExpression | KeywordArgument> | ListSplatOptions | DictionarySplatOptions | ParenthesizedExpressionOptions | KeywordArgumentOptions)[]): ArgumentListBuilder {
    const options: Omit<ArgumentListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ArgumentListOptions, 'nodeKind'>
      : { children: input } as Omit<ArgumentListOptions, 'nodeKind'>;
    const b = new ArgumentListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'list_splat': return list_splat.from(_v);   case 'dictionary_splat': return dictionary_splat.from(_v);   case 'parenthesized_expression': return parenthesized_expression.from(_v);   case 'keyword_argument': return keyword_argument.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
