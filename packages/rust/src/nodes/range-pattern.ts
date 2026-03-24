import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanLiteral, CharLiteral, Crate, FloatLiteral, Identifier, IntegerLiteral, Metavariable, NegativeLiteral, RangePattern, RawStringLiteral, ScopedIdentifier, Self, StringLiteral, Super } from '../types.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { negative_literal } from './negative-literal.js';
import type { NegativeLiteralOptions } from './negative-literal.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';


class RangePatternBuilder extends Builder<RangePattern> {
  private _left?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>;
  private _right?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>;

  constructor() { super(); }

  left(value: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>): this {
    this._left = value;
    return this;
  }

  right(value: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._right) {
      parts.push('...');
      if (this._right) parts.push(this.renderChild(this._right, ctx));
    }
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RangePattern {
    return {
      kind: 'range_pattern',
      left: this._left ? this._left.build(ctx) : undefined,
      right: this._right ? this._right.build(ctx) : undefined,
    } as RangePattern;
  }

  override get nodeKind(): 'range_pattern' { return 'range_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._right) {
      parts.push({ kind: 'token', text: '...', type: '...' });
      if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    }
    return parts;
  }
}

export type { RangePatternBuilder };

export function range_pattern(): RangePatternBuilder {
  return new RangePatternBuilder();
}

export interface RangePatternOptions {
  nodeKind: 'range_pattern';
  left?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions;
  right?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Self | Identifier | Metavariable | Super | Crate | ScopedIdentifier> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions;
}

export namespace range_pattern {
  export function from(options: Omit<RangePatternOptions, 'nodeKind'>): RangePatternBuilder {
    const b = new RangePatternBuilder();
    if (options.left !== undefined) {
      const _v = options.left;
      if (_v instanceof Builder) {
        b.left(_v);
      } else {
        switch (_v.nodeKind) {
          case 'string_literal': b.left(string_literal.from(_v)); break;
          case 'raw_string_literal': b.left(raw_string_literal.from(_v)); break;
          case 'negative_literal': b.left(negative_literal.from(_v)); break;
          case 'scoped_identifier': b.left(scoped_identifier.from(_v)); break;
        }
      }
    }
    if (options.right !== undefined) {
      const _v = options.right;
      if (_v instanceof Builder) {
        b.right(_v);
      } else {
        switch (_v.nodeKind) {
          case 'string_literal': b.right(string_literal.from(_v)); break;
          case 'raw_string_literal': b.right(raw_string_literal.from(_v)); break;
          case 'negative_literal': b.right(negative_literal.from(_v)); break;
          case 'scoped_identifier': b.right(scoped_identifier.from(_v)); break;
        }
      }
    }
    return b;
  }
}
