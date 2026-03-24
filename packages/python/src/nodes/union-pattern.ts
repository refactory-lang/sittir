import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';
import { class_pattern } from './class-pattern.js';
import type { ClassPatternOptions } from './class-pattern.js';
import { splat_pattern } from './splat-pattern.js';
import type { SplatPatternOptions } from './splat-pattern.js';
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


class UnionPatternBuilder extends Builder<UnionPattern> {
  private _children: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[] = [];

  constructor() { super(); }

  children(...value: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('|');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): UnionPattern {
    return {
      kind: 'union_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as UnionPattern;
  }

  override get nodeKind(): 'union_pattern' { return 'union_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '|', type: '|' });
    return parts;
  }
}

export type { UnionPatternBuilder };

export function union_pattern(): UnionPatternBuilder {
  return new UnionPatternBuilder();
}

export interface UnionPatternOptions {
  nodeKind: 'union_pattern';
  children?: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions | (Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions)[];
}

export namespace union_pattern {
  export function from(input: Omit<UnionPatternOptions, 'nodeKind'> | Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions | (Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | ListPatternOptions | TuplePatternOptions | DictPatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions)[]): UnionPatternBuilder {
    const options: Omit<UnionPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<UnionPatternOptions, 'nodeKind'>
      : { children: input } as Omit<UnionPatternOptions, 'nodeKind'>;
    const b = new UnionPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'class_pattern': return class_pattern.from(_v);   case 'splat_pattern': return splat_pattern.from(_v);   case 'list_pattern': return list_pattern.from(_v);   case 'tuple_pattern': return tuple_pattern.from(_v);   case 'dict_pattern': return dict_pattern.from(_v);   case 'string': return string.from(_v);   case 'concatenated_string': return concatenated_string.from(_v);   case 'complex_pattern': return complex_pattern.from(_v);   case 'dotted_name': return dotted_name.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
