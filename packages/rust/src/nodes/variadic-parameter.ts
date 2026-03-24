import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanLiteral, CapturedPattern, CharLiteral, ConstBlock, FloatLiteral, GenericPattern, Identifier, IntegerLiteral, MacroInvocation, MutPattern, MutableSpecifier, NegativeLiteral, OrPattern, RangePattern, RawStringLiteral, RefPattern, ReferencePattern, RemainingFieldPattern, ScopedIdentifier, SlicePattern, StringLiteral, StructPattern, TuplePattern, TupleStructPattern, VariadicParameter } from '../types.js';
import { string_literal } from './string-literal.js';
import type { StringLiteralOptions } from './string-literal.js';
import { raw_string_literal } from './raw-string-literal.js';
import type { RawStringLiteralOptions } from './raw-string-literal.js';
import { negative_literal } from './negative-literal.js';
import type { NegativeLiteralOptions } from './negative-literal.js';
import { scoped_identifier } from './scoped-identifier.js';
import type { ScopedIdentifierOptions } from './scoped-identifier.js';
import { generic_pattern } from './generic-pattern.js';
import type { GenericPatternOptions } from './generic-pattern.js';
import { tuple_pattern } from './tuple-pattern.js';
import type { TuplePatternOptions } from './tuple-pattern.js';
import { tuple_struct_pattern } from './tuple-struct-pattern.js';
import type { TupleStructPatternOptions } from './tuple-struct-pattern.js';
import { struct_pattern } from './struct-pattern.js';
import type { StructPatternOptions } from './struct-pattern.js';
import { ref_pattern } from './ref-pattern.js';
import type { RefPatternOptions } from './ref-pattern.js';
import { slice_pattern } from './slice-pattern.js';
import type { SlicePatternOptions } from './slice-pattern.js';
import { captured_pattern } from './captured-pattern.js';
import type { CapturedPatternOptions } from './captured-pattern.js';
import { reference_pattern } from './reference-pattern.js';
import type { ReferencePatternOptions } from './reference-pattern.js';
import { mut_pattern } from './mut-pattern.js';
import type { MutPatternOptions } from './mut-pattern.js';
import { range_pattern } from './range-pattern.js';
import type { RangePatternOptions } from './range-pattern.js';
import { or_pattern } from './or-pattern.js';
import type { OrPatternOptions } from './or-pattern.js';
import { const_block } from './const-block.js';
import type { ConstBlockOptions } from './const-block.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';


class VariadicParameterBuilder extends Builder<VariadicParameter> {
  private _pattern?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>;
  private _children: Builder<MutableSpecifier>[] = [];

  constructor() { super(); }

  pattern(value: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>): this {
    this._pattern = value;
    return this;
  }

  children(...value: Builder<MutableSpecifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    if (this._pattern) {
      if (this._pattern) parts.push(this.renderChild(this._pattern, ctx));
      parts.push(':');
    }
    parts.push('...');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): VariadicParameter {
    return {
      kind: 'variadic_parameter',
      pattern: this._pattern ? this._pattern.build(ctx) : undefined,
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as VariadicParameter;
  }

  override get nodeKind(): 'variadic_parameter' { return 'variadic_parameter'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    if (this._pattern) {
      if (this._pattern) parts.push({ kind: 'builder', builder: this._pattern, fieldName: 'pattern' });
      parts.push({ kind: 'token', text: ':', type: ':' });
    }
    parts.push({ kind: 'token', text: '...', type: '...' });
    return parts;
  }
}

export type { VariadicParameterBuilder };

export function variadic_parameter(): VariadicParameterBuilder {
  return new VariadicParameterBuilder();
}

export interface VariadicParameterOptions {
  nodeKind: 'variadic_parameter';
  pattern?: Builder<StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | ReferencePatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions;
  children?: Builder<MutableSpecifier> | string | (Builder<MutableSpecifier> | string)[];
}

export namespace variadic_parameter {
  export function from(options: Omit<VariadicParameterOptions, 'nodeKind'>): VariadicParameterBuilder {
    const b = new VariadicParameterBuilder();
    if (options.pattern !== undefined) {
      const _v = options.pattern;
      if (_v instanceof Builder) {
        b.pattern(_v);
      } else {
        switch (_v.nodeKind) {
          case 'string_literal': b.pattern(string_literal.from(_v)); break;
          case 'raw_string_literal': b.pattern(raw_string_literal.from(_v)); break;
          case 'negative_literal': b.pattern(negative_literal.from(_v)); break;
          case 'scoped_identifier': b.pattern(scoped_identifier.from(_v)); break;
          case 'generic_pattern': b.pattern(generic_pattern.from(_v)); break;
          case 'tuple_pattern': b.pattern(tuple_pattern.from(_v)); break;
          case 'tuple_struct_pattern': b.pattern(tuple_struct_pattern.from(_v)); break;
          case 'struct_pattern': b.pattern(struct_pattern.from(_v)); break;
          case 'ref_pattern': b.pattern(ref_pattern.from(_v)); break;
          case 'slice_pattern': b.pattern(slice_pattern.from(_v)); break;
          case 'captured_pattern': b.pattern(captured_pattern.from(_v)); break;
          case 'reference_pattern': b.pattern(reference_pattern.from(_v)); break;
          case 'mut_pattern': b.pattern(mut_pattern.from(_v)); break;
          case 'range_pattern': b.pattern(range_pattern.from(_v)); break;
          case 'or_pattern': b.pattern(or_pattern.from(_v)); break;
          case 'const_block': b.pattern(const_block.from(_v)); break;
          case 'macro_invocation': b.pattern(macro_invocation.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => typeof _x === 'string' ? new LeafBuilder('mutable_specifier', _x) : _x));
    }
    return b;
  }
}
