import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Literal, Metavariable, MutableSpecifier, PrimitiveType, Self, Super, TokenRepetition, TokenTree } from '../types.js';


class TokenTreeBuilder extends Builder<TokenTree> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
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

  build(ctx?: RenderContext): TokenTree {
    return {
      kind: 'token_tree',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenTree;
  }

  override get nodeKind(): string { return 'token_tree'; }

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

export type { TokenTreeBuilder };

export function token_tree(): TokenTreeBuilder {
  return new TokenTreeBuilder();
}

export interface TokenTreeOptions {
  children?: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenRepetition | TokenTree> | (Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenRepetition | TokenTree>)[];
}

export namespace token_tree {
  export function from(options: TokenTreeOptions): TokenTreeBuilder {
    const b = new TokenTreeBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
