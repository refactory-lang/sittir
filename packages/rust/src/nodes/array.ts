import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class ArrayBuilder extends BaseBuilder<ArrayExpression> {
  private _length?: Child;
  private _children: Child[] = [];

  constructor() { super(); }

  length(value: Child): this {
    this._length = value;
    return this;
  }

  children(value: Child[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('[');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push(';');
    if (this._length) parts.push(this.renderChild(this._length, ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ArrayExpression {
    return {
      kind: 'array_expression',
      length: this._length ? this.renderChild(this._length, ctx) : undefined,
      children: this._children.map(c => this.renderChild(c, ctx)),
    } as unknown as ArrayExpression;
  }

  override get nodeKind(): string { return 'array_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '[', type: '[' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: ';', type: ';' });
    if (this._length) parts.push({ kind: 'builder', builder: this._length, fieldName: 'length' });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export function array(): ArrayBuilder {
  return new ArrayBuilder();
}
