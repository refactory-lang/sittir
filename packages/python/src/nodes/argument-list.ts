import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArgumentList, DictionarySplat, Expression, KeywordArgument, ListSplat, ParenthesizedExpression } from '../types.js';


class ArgumentListBuilder extends Builder<ArgumentList> {
  private _children: Builder<DictionarySplat | Expression | KeywordArgument | ListSplat | ParenthesizedExpression>[] = [];

  constructor() { super(); }

  children(...value: Builder<DictionarySplat | Expression | KeywordArgument | ListSplat | ParenthesizedExpression>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArgumentList {
    return {
      kind: 'argument_list',
      children: this._children.map(c => c.build(ctx)),
    } as ArgumentList;
  }

  override get nodeKind(): string { return 'argument_list'; }

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
  children?: Builder<DictionarySplat | Expression | KeywordArgument | ListSplat | ParenthesizedExpression> | (Builder<DictionarySplat | Expression | KeywordArgument | ListSplat | ParenthesizedExpression>)[];
}

export namespace argument_list {
  export function from(options: ArgumentListOptions): ArgumentListBuilder {
    const b = new ArgumentListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
