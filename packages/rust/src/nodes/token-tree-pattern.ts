import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanLiteral, CharLiteral, Crate, FloatLiteral, Identifier, IntegerLiteral, Metavariable, MutableSpecifier, PrimitiveType, RawStringLiteral, Self, StringLiteral, Super, TokenBindingPattern, TokenRepetitionPattern, TokenTreePattern } from '../types.js';
import { token_repetition_pattern } from './token-repetition-pattern.js';
import type { TokenRepetitionPatternOptions } from './token-repetition-pattern.js';
import { token_binding_pattern } from './token-binding-pattern.js';
import type { TokenBindingPatternOptions } from './token-binding-pattern.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';


class TokenTreePatternBuilder extends Builder<TokenTreePattern> {
  private _children: Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType>[] = [];

  constructor() { super(); }

  children(...value: Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType>[]): this {
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

  override get nodeKind(): 'token_tree_pattern' { return 'token_tree_pattern'; }

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
  nodeKind: 'token_tree_pattern';
  children?: Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenRepetitionPatternOptions | TokenBindingPatternOptions | StringLiteralOptions | RawStringLiteralOptions | (Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenRepetitionPatternOptions | TokenBindingPatternOptions | StringLiteralOptions | RawStringLiteralOptions)[];
}

export namespace token_tree_pattern {
  export function from(input: Omit<TokenTreePatternOptions, 'nodeKind'> | Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenRepetitionPatternOptions | TokenBindingPatternOptions | StringLiteralOptions | RawStringLiteralOptions | (Builder<TokenTreePattern | TokenRepetitionPattern | TokenBindingPattern | Metavariable | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | Identifier | MutableSpecifier | Self | Super | Crate | PrimitiveType> | TokenRepetitionPatternOptions | TokenBindingPatternOptions | StringLiteralOptions | RawStringLiteralOptions)[]): TokenTreePatternBuilder {
    const options: Omit<TokenTreePatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TokenTreePatternOptions, 'nodeKind'>
      : { children: input } as Omit<TokenTreePatternOptions, 'nodeKind'>;
    const b = new TokenTreePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'token_repetition_pattern': return token_repetition_pattern.from(_v);   case 'token_binding_pattern': return token_binding_pattern.from(_v);   case 'string_literal': return string_literal.from(_v);   case 'raw_string_literal': return raw_string_literal.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
