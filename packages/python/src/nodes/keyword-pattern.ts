import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClassPattern, ComplexPattern, ConcatenatedString, DictPattern, DottedName, False, Float, Identifier, Integer, KeywordPattern, ListPattern, None, SplatPattern, String, True, TuplePattern, UnionPattern } from '../types.js';


class KeywordPatternBuilder extends Builder<KeywordPattern> {
  private _children: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Identifier | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[] = [];

  constructor(...children: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Identifier | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('=');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): KeywordPattern {
    return {
      kind: 'keyword_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as KeywordPattern;
  }

  override get nodeKind(): string { return 'keyword_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '=', type: '=' });
    return parts;
  }
}

export type { KeywordPatternBuilder };

export function keyword_pattern(...children: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Identifier | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>[]): KeywordPatternBuilder {
  return new KeywordPatternBuilder(...children);
}

export interface KeywordPatternOptions {
  children: Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Identifier | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern> | (Builder<ClassPattern | ComplexPattern | ConcatenatedString | DictPattern | DottedName | False | Float | Identifier | Integer | ListPattern | None | SplatPattern | String | True | TuplePattern | UnionPattern>)[];
}

export namespace keyword_pattern {
  export function from(options: KeywordPatternOptions): KeywordPatternBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new KeywordPatternBuilder(..._arr);
    return b;
  }
}
