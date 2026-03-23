import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { TuplePattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class TuplePatternBuilder extends BaseBuilder<TuplePattern> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
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
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as TuplePattern;
  }

  override get nodeKind(): string { return 'tuple_pattern'; }

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

export function tuple_pattern(): TuplePatternBuilder {
  return new TuplePatternBuilder();
}
