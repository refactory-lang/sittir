import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentPattern } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AssignmentPatternBuilder extends BaseBuilder<AssignmentPattern> {
  private _left: Child;
  private _right!: Child;

  constructor(left: Child) {
    super();
    this._left = left;
  }

  right(value: Child): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    parts.push('=');
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AssignmentPattern {
    return {
      kind: 'assignment_pattern',
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as AssignmentPattern;
  }

  override get nodeKind(): string { return 'assignment_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function assignment_pattern(left: Child): AssignmentPatternBuilder {
  return new AssignmentPatternBuilder(left);
}
