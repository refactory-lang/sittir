import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanLiteral, CapturedPattern, CharLiteral, ConstBlock, FloatLiteral, GenericPattern, Identifier, IntegerLiteral, MacroInvocation, MutPattern, MutableSpecifier, NegativeLiteral, OrPattern, RangePattern, RawStringLiteral, RefPattern, ReferencePattern, RemainingFieldPattern, ScopedIdentifier, SlicePattern, StringLiteral, StructPattern, TuplePattern, TupleStructPattern } from '../types.js';
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


class ReferencePatternBuilder extends Builder<ReferencePattern> {
  private _children: Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>[] = [];

  constructor(...children: Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('&');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ReferencePattern {
    return {
      kind: 'reference_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as ReferencePattern;
  }

  override get nodeKind(): 'reference_pattern' { return 'reference_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '&', type: '&' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ReferencePatternBuilder };

export function reference_pattern(...children: Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation>[]): ReferencePatternBuilder {
  return new ReferencePatternBuilder(...children);
}

export interface ReferencePatternOptions {
  nodeKind: 'reference_pattern';
  children?: Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions | (Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions)[];
}

export namespace reference_pattern {
  export function from(input: Omit<ReferencePatternOptions, 'nodeKind'> | Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions | (Builder<MutableSpecifier | StringLiteral | RawStringLiteral | CharLiteral | BooleanLiteral | IntegerLiteral | FloatLiteral | NegativeLiteral | Identifier | ScopedIdentifier | GenericPattern | TuplePattern | TupleStructPattern | StructPattern | RefPattern | SlicePattern | CapturedPattern | ReferencePattern | RemainingFieldPattern | MutPattern | RangePattern | OrPattern | ConstBlock | MacroInvocation> | StringLiteralOptions | RawStringLiteralOptions | NegativeLiteralOptions | ScopedIdentifierOptions | GenericPatternOptions | TuplePatternOptions | TupleStructPatternOptions | StructPatternOptions | RefPatternOptions | SlicePatternOptions | CapturedPatternOptions | MutPatternOptions | RangePatternOptions | OrPatternOptions | ConstBlockOptions | MacroInvocationOptions)[]): ReferencePatternBuilder {
    const options: Omit<ReferencePatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ReferencePatternOptions, 'nodeKind'>
      : { children: input } as Omit<ReferencePatternOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ReferencePatternBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'string_literal': return string_literal.from(_v);   case 'raw_string_literal': return raw_string_literal.from(_v);   case 'negative_literal': return negative_literal.from(_v);   case 'scoped_identifier': return scoped_identifier.from(_v);   case 'generic_pattern': return generic_pattern.from(_v);   case 'tuple_pattern': return tuple_pattern.from(_v);   case 'tuple_struct_pattern': return tuple_struct_pattern.from(_v);   case 'struct_pattern': return struct_pattern.from(_v);   case 'ref_pattern': return ref_pattern.from(_v);   case 'slice_pattern': return slice_pattern.from(_v);   case 'captured_pattern': return captured_pattern.from(_v);   case 'mut_pattern': return mut_pattern.from(_v);   case 'range_pattern': return range_pattern.from(_v);   case 'or_pattern': return or_pattern.from(_v);   case 'const_block': return const_block.from(_v);   case 'macro_invocation': return macro_invocation.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
