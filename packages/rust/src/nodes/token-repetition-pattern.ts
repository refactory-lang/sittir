import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, Literal, Metavariable, MutableSpecifier, PrimitiveType, Self, Super, TokenBindingPattern, TokenRepetitionPattern, TokenTreePattern } from '../types.js';


class TokenRepetitionPatternBuilder extends Builder<TokenRepetitionPattern> {
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

  build(ctx?: RenderContext): TokenRepetitionPattern {
    return {
      kind: 'token_repetition_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TokenRepetitionPattern;
  }

  override get nodeKind(): string { return 'token_repetition_pattern'; }

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

export type { TokenRepetitionPatternBuilder };

export function token_repetition_pattern(): TokenRepetitionPatternBuilder {
  return new TokenRepetitionPatternBuilder();
}

export interface TokenRepetitionPatternOptions {
  children?: Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern> | (Builder<Literal | Crate | Identifier | Metavariable | MutableSpecifier | PrimitiveType | Self | Super | TokenBindingPattern | TokenRepetitionPattern | TokenTreePattern>)[];
}

export namespace token_repetition_pattern {
  export function from(options: TokenRepetitionPatternOptions): TokenRepetitionPatternBuilder {
    const b = new TokenRepetitionPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
