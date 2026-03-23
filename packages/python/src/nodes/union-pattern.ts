import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';


class UnionPatternBuilder extends Builder<UnionPattern> {
  private _children: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[]): this {
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

  override get nodeKind(): string { return 'union_pattern'; }

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
  children?: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern> | (Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>)[];
}

export namespace union_pattern {
  export function from(options: UnionPatternOptions): UnionPatternBuilder {
    const b = new UnionPatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
