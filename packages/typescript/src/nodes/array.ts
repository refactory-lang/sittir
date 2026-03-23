import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Array } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrayBuilder extends BaseBuilder<Array> {
  private _children: Child[] = [];

  constructor() { super(); }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Array {
    return {
      kind: 'array',
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as Array;
  }

  override get nodeKind(): string { return 'array'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export function array(): ArrayBuilder {
  return new ArrayBuilder();
}
