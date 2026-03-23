import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ClosureExpression, Pattern, TuplePattern } from '../types.js';


class TuplePatternBuilder extends Builder<TuplePattern> {
  private _children: Builder[] = [];

  constructor() { super(); }

  children(...value: Builder[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('(');
    if (this._children.length === 1) {
      parts.push(',');
      parts.push(this.renderChild(this._children[0]!, ctx));
    } else if (this._children.length > 1) {
      parts.push(this.renderChildren(this._children, ' , ', ctx));
    }
    parts.push(')');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): TuplePattern {
    return {
      kind: 'tuple_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TuplePattern;
  }

  override get nodeKind(): string { return 'tuple_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '(', type: '(' });
    for (let i = 0; i < this._children.length; i++) {
      if (i > 0 || this._children.length === 1) parts.push({ kind: 'token', text: ',', type: ',' });
      parts.push({ kind: 'builder', builder: this._children[i]! });
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
  children?: Builder<Pattern | ClosureExpression> | (Builder<Pattern | ClosureExpression>)[];
}

export namespace tuple_pattern {
  export function from(options: TuplePatternOptions): TuplePatternBuilder {
    const b = new TuplePatternBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr);
    }
    return b;
  }
}
