import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ObjectPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ObjectPatternBuilder extends BaseBuilder<ObjectPattern> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('object');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ', ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ObjectPattern {
    return {
      kind: 'object_pattern',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ObjectPattern;
  }

  override get nodeKind(): string { return 'object_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'object' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export function object_pattern(): ObjectPatternBuilder {
  return new ObjectPatternBuilder();
}
