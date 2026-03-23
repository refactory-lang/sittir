import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CasePattern, ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';


class DictPatternBuilder extends Builder<DictPattern> {
  private _key: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[] = [];
  private _value: Builder<CasePattern>[] = [];
  private _children: Builder<SplatPattern>[] = [];

  constructor() { super(); }

  key(...value: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[]): this {
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
      parts.push(':');
      if (this._value.length > 0) parts.push(this.renderChildren(this._value, ', ', ctx));
      parts.push(',');
      parts.push(':');
      parts.push(',');
    }
    parts.push('}');
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

  override get nodeKind(): string { return 'dict_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    if (this._key.length > 0) {
      for (const child of this._key) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'key' });
      }
      parts.push({ kind: 'token', text: ':', type: ':' });
      for (const child of this._value) {
        parts.push({ kind: 'builder', builder: child, fieldName: 'value' });
      }
      parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'token', text: ':', type: ':' });
      parts.push({ kind: 'token', text: ',', type: ',' });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { DictPatternBuilder };

export function dict_pattern(): DictPatternBuilder {
  return new DictPatternBuilder();
}

export interface DictPatternOptions {
  key?: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern> | (Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>)[];
  value?: Builder<CasePattern> | (Builder<CasePattern>)[];
  children?: Builder<SplatPattern> | (Builder<SplatPattern>)[];
}

export namespace dict_pattern {
  export function from(options: DictPatternOptions): DictPatternBuilder {
    const b = new DictPatternBuilder();
    if (options.key !== undefined) {
      const _v = options.key;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.key(..._arr);
    }
    if (options.value !== undefined) {
      const _v = options.value;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.value(..._arr);
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
