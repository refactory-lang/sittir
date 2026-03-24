import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsPattern, CasePattern, ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, KeywordPattern, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';
import { as_pattern } from './as-pattern.js';
import type { AsPatternOptions } from './as-pattern.js';
import { keyword_pattern } from './keyword-pattern.js';
import type { KeywordPatternOptions } from './keyword-pattern.js';
import { class_pattern } from './class-pattern.js';
import type { ClassPatternOptions } from './class-pattern.js';
import { splat_pattern } from './splat-pattern.js';
import type { SplatPatternOptions } from './splat-pattern.js';
import { union_pattern } from './union-pattern.js';
import type { UnionPatternOptions } from './union-pattern.js';
import { list_pattern } from './list-pattern.js';
import type { ListPatternOptions } from './list-pattern.js';
import { tuple_pattern } from './tuple-pattern.js';
import type { TuplePatternOptions } from './tuple-pattern.js';
import { dict_pattern } from './dict-pattern.js';
import type { DictPatternOptions } from './dict-pattern.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { concatenated_string } from './concatenated-string.js';
import type { ConcatenatedStringOptions } from './concatenated-string.js';
import { complex_pattern } from './complex-pattern.js';
import type { ComplexPatternOptions } from './complex-pattern.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';


class CasePatternBuilder extends Builder<CasePattern> {
  private _children: Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[] = [];

  constructor() { super(); }

  children(...value: Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): CasePattern {
    return {
      kind: 'case_pattern',
      children: this._children[0] ? this._children[0].build(ctx) : undefined,
    } as CasePattern;
  }

  override get nodeKind(): 'case_pattern' { return 'case_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { CasePatternBuilder };

export function case_pattern(): CasePatternBuilder {
  return new CasePatternBuilder();
}

export interface CasePatternOptions {
  nodeKind: 'case_pattern';
  children?: Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | AsPatternOptions | KeywordPatternOptions | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions | (Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | AsPatternOptions | KeywordPatternOptions | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions)[];
}

export namespace case_pattern {
  export function from(input: Omit<CasePatternOptions, 'nodeKind'> | Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | AsPatternOptions | KeywordPatternOptions | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions | (Builder<AsPattern | KeywordPattern | ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | AsPatternOptions | KeywordPatternOptions | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions)[]): CasePatternBuilder {
    const options: Omit<CasePatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<CasePatternOptions, 'nodeKind'>
      : { children: input } as Omit<CasePatternOptions, 'nodeKind'>;
    const b = new CasePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'as_pattern': return as_pattern.from(_v);   case 'keyword_pattern': return keyword_pattern.from(_v);   case 'class_pattern': return class_pattern.from(_v);   case 'splat_pattern': return splat_pattern.from(_v);   case 'union_pattern': return union_pattern.from(_v);   case 'list_pattern': return list_pattern.from(_v);   case 'tuple_pattern': return tuple_pattern.from(_v);   case 'dict_pattern': return dict_pattern.from(_v);   case 'string': return string.from(_v);   case 'concatenated_string': return concatenated_string.from(_v);   case 'complex_pattern': return complex_pattern.from(_v);   case 'dotted_name': return dotted_name.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
