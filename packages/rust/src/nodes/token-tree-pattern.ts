import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Literal, Metavariable, MutableSpecifier, PrimitiveType, Self, Super, TokenBindingPattern, TokenRepetitionPattern, TokenTreePattern } from '../types.js';


class TokenTreePatternBuilder extends Builder<TokenTreePattern> {
  private _children: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern>[]): this {
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

  build(ctx?: RenderContext): TokenTreePattern {
    return {
      kind: 'token_tree_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as TokenTreePattern;
  }

  override get nodeKind(): string { return 'token_tree_pattern'; }

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

export type { TokenTreePatternBuilder };

export function token_tree_pattern(): TokenTreePatternBuilder {
  return new TokenTreePatternBuilder();
}

export interface TokenTreePatternOptions {
  children?: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern> | (Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern>)[];
}

export namespace token_tree_pattern {
  export function from(options: TokenTreePatternOptions): TokenTreePatternBuilder {
    const b = new TokenTreePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
