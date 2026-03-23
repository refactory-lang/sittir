import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrayPatternBuilder extends BaseBuilder<ArrayPattern> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('array');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayPattern {
    return {
      kind: 'array_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ArrayPattern;
  }

  override get nodeKind(): string { return 'array_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'array' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function array_pattern(): ArrayPatternBuilder {
  return new ArrayPatternBuilder();
}
