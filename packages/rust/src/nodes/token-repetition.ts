import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanLiteral, CharLiteral, Crate, FloatLiteral, Identifier, IntegerLiteral, Metavariable, MutableSpecifier, PrimitiveType, RawStringLiteral, Self, StringLiteral, Super, TokenRepetition, TokenTree } from '../types.js';
import { token_tree } from './token-tree.js';
import type { TokenTreeOptions } from './token-tree.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';


class TokenRepetitionBuilder extends Builder<TokenRepetition> {
  private _children: Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType>[] = [];

  constructor() { super(); }

  children(...value: Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType>[]): this {
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
      children: this._children.map(c => c.build(ctx)),
    } as TokenRepetition;
  }

  override get nodeKind(): 'token_repetition' { return 'token_repetition'; }

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
  nodeKind: 'token_repetition';
  children?: Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenTreeOptions | StringLiteralOptions | RawStringLiteralOptions | (Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenTreeOptions | StringLiteralOptions | RawStringLiteralOptions)[];
}

export namespace token_repetition {
  export function from(input: Omit<TokenRepetitionOptions, 'nodeKind'> | Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenTreeOptions | StringLiteralOptions | RawStringLiteralOptions | (Builder<TokenTree | TokenRepetition | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenTreeOptions | StringLiteralOptions | RawStringLiteralOptions)[]): TokenRepetitionBuilder {
    const options: Omit<TokenRepetitionOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TokenRepetitionOptions, 'nodeKind'>
      : { children: input } as Omit<TokenRepetitionOptions, 'nodeKind'>;
    const b = new TokenRepetitionBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'token_tree': return token_tree.from(_v);   case 'string_literal': return string_literal.from(_v);   case 'raw_string_literal': return raw_string_literal.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
