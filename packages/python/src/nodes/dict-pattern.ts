import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CasePattern, ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';
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
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { concatenated_string } from './concatenated-string.js';
import type { ConcatenatedStringOptions } from './concatenated-string.js';
import { complex_pattern } from './complex-pattern.js';
import type { ComplexPatternOptions } from './complex-pattern.js';
import { dotted_name } from './dotted-name.js';
import type { DottedNameOptions } from './dotted-name.js';
import { case_pattern } from './case-pattern.js';
import type { CasePatternOptions } from './case-pattern.js';


class DictPatternBuilder extends Builder<DictPattern> {
  private _key: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[] = [];
  private _value: Builder<CasePattern>[] = [];
  private _children: Builder<SplatPattern>[] = [];

  constructor() { super(); }

  key(...value: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName>[]): this {
    this._key = value;
    return this;
  }

  value(...value: Builder<CasePattern>[]): this {
    this._value = value;
    return this;
  }

  children(...value: Builder<SplatPattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._key.length > 0) {
      if (this._key.length > 0) parts.push(this.renderChildren(this._key, ', ', ctx));
      if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
      if (this._value.length > 0) {
        parts.push(':');
        if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
      }
      parts.push(',');
      if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
      parts.push(',');
    }
    parts.push('}');
    if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DictPattern {
    return {
      kind: 'dict_pattern',
      key: this._key.map(c => c.build(ctx)),
      value: this._value.map(c => c.build(ctx)),
      children: this._children.map(c => c.build(ctx)),
    } as DictPattern;
  }

  override get nodeKind(): 'dict_pattern' { return 'dict_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._key.length > 0) {
      for (const child of this._key) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'key' });
      }
      if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
      if (this._value.length > 0) {
        parts.push({ kind: 'token', text: ':', type: ':' });
        for (const child of this._value) {
          parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
        }
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
      if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    for (const child of this._value) {
      parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
    }
    return parts;
  }
}

export type { DictPatternBuilder };

export function dict_pattern(): DictPatternBuilder {
  return new DictPatternBuilder();
}

export interface DictPatternOptions {
  nodeKind: 'dict_pattern';
  key?: Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions | (Builder<ClassPattern | SplatPattern | UnionPattern | ListPattern | TuplePattern | DictPattern | String | ConcatenatedString | True | False | None | Integer | Float | ComplexPattern | DottedName> | ClassPatternOptions | SplatPatternOptions | UnionPatternOptions | ListPatternOptions | TuplePatternOptions | StringOptions | ConcatenatedStringOptions | ComplexPatternOptions | DottedNameOptions)[];
  value?: Builder<CasePattern> | Omit<CasePatternOptions, 'nodeKind'> | (Builder<CasePattern> | Omit<CasePatternOptions, 'nodeKind'>)[];
  children?: Builder<SplatPattern> | Omit<SplatPatternOptions, 'nodeKind'> | (Builder<SplatPattern> | Omit<SplatPatternOptions, 'nodeKind'>)[];
}

export namespace dict_pattern {
  export function from(options: Omit<DictPatternOptions, 'nodeKind'>): DictPatternBuilder {
    const b = new DictPatternBuilder();
    if (options.key !== undefined) {
      const _v = options.key;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.key(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'class_pattern': return class_pattern.from(_v);   case 'splat_pattern': return splat_pattern.from(_v);   case 'union_pattern': return union_pattern.from(_v);   case 'list_pattern': return list_pattern.from(_v);   case 'tuple_pattern': return tuple_pattern.from(_v);   case 'string': return string.from(_v);   case 'concatenated_string': return concatenated_string.from(_v);   case 'complex_pattern': return complex_pattern.from(_v);   case 'dotted_name': return dotted_name.from(_v); } throw new Error('unreachable'); }));
    }
    if (options.value !== undefined) {
      const _v = options.value;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.value(..._arr.map(_v => _v instanceof Builder ? _v : case_pattern.from(_v)));
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_x => _x instanceof Builder ? _x : splat_pattern.from(_x)));
    }
    return b;
  }
}
