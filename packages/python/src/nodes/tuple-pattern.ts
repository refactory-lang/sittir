import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Pattern, TuplePattern } from '../types.js';


class TuplePatternBuilder extends Builder<TuplePattern> {
  private _children: Builder<Pattern>[] = [];

  constructor() { super(); }

  children(...value: Builder<Pattern>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TuplePattern {
    return {
      kind: 'tuple_pattern',
      children: this._children.map(c => c.build(ctx)),
    } as TuplePattern;
  }

  override get nodeKind(): 'tuple_pattern' { return 'tuple_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ')', type: ')' });
    return parts;
  }
}

export type { TuplePatternBuilder };

export function tuple_pattern(): TuplePatternBuilder {
  return new TuplePatternBuilder();
}

export interface TuplePatternOptions {
  nodeKind: 'tuple_pattern';
  children?: Builder<Pattern> | (Builder<Pattern>)[];
}

export namespace tuple_pattern {
  export function from(input: Omit<TuplePatternOptions, 'nodeKind'> | Builder<Pattern> | (Builder<Pattern>)[]): TuplePatternBuilder {
    const options: Omit<TuplePatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TuplePatternOptions, 'nodeKind'>
      : { children: input } as Omit<TuplePatternOptions, 'nodeKind'>;
    const b = new TuplePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
