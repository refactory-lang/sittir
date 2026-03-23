import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { RangePattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class RangePatternBuilder extends BaseBuilder<RangePattern> {
  private _left?: Child;
  private _right?: Child;

  constructor() { super(); }

  left(value: Child): this {
    this._left = value;
    return this;
  }

  right(value: Child): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('...');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): RangePattern {
    return {
      kind: 'range_pattern',
      left: this._left ? this.renderChild(this._left, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as RangePattern;
  }

  override get nodeKind(): string { return 'range_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '...', type: '...' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function range_pattern(): RangePatternBuilder {
  return new RangePatternBuilder();
}
