import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AsPattern, CasePattern, ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Integer, KeywordPattern, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';


class CasePatternBuilder extends Builder<CasePattern> {
  private _children: Builder<AsPattern | ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | KeywordPattern | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<AsPattern | ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | KeywordPattern | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[]): this {
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
      children: this._children[0]?.build(ctx),
    } as CasePattern;
  }

  override get nodeKind(): string { return 'case_pattern'; }

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
  children?: Builder<AsPattern | ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | KeywordPattern | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern> | (Builder<AsPattern | ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Integer | KeywordPattern | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>)[];
}

export namespace case_pattern {
  export function from(options: CasePatternOptions): CasePatternBuilder {
    const b = new CasePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
