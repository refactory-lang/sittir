import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Crate, Identifier, LiteralPattern, Metavariable, RangePattern, ScopedIdentifier, Self, Super } from '../types.js';


class RangePatternBuilder extends Builder<RangePattern> {
  private _left?: Builder;
  private _right?: Builder;

  constructor() { super(); }

  left(value: Builder): this {
    this._left = value;
    return this;
  }

  right(value: Builder): this {
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

export type { RangePatternBuilder };

export function range_pattern(): RangePatternBuilder {
  return new RangePatternBuilder();
}

export interface RangePatternOptions {
  left?: Builder<LiteralPattern | Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
  right?: Builder<LiteralPattern | Crate | Identifier | Metavariable | ScopedIdentifier | Self | Super>;
}

export namespace range_pattern {
  export function from(options: RangePatternOptions): RangePatternBuilder {
    const b = new RangePatternBuilder();
    if (options.left !== undefined) b.left(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
