import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Literal, Metavariable, MutableSpecifier, PrimitiveType, Self, Super, TokenRepetition, TokenTree } from '../types.js';


class TokenRepetitionBuilder extends Builder<TokenRepetition> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('$');
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    parts.push('+');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TokenRepetition {
    return {
      kind: 'token_repetition',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenRepetition;
  }

  override get nodeKind(): string { return 'token_repetition'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '$', type: '$' });
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    parts.push({ kind: 'token', text: '+', type: '+' });
    return parts;
  }
}

export type { TokenRepetitionBuilder };

export function token_repetition(): TokenRepetitionBuilder {
  return new TokenRepetitionBuilder();
}

export interface TokenRepetitionOptions {
  children?: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenRepetition | TokenTree> | (Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenRepetition | TokenTree>)[];
}

export namespace token_repetition {
  export function from(options: TokenRepetitionOptions): TokenRepetitionBuilder {
    const b = new TokenRepetitionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
