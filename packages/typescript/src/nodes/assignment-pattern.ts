import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentPattern, Expression, Pattern } from '../types.js';


class AssignmentPatternBuilder extends Builder<AssignmentPattern> {
  private _left: Builder;
  private _right!: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  right(value: Builder): this {
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

export type { AssignmentPatternBuilder };

export function assignment_pattern(left: Builder): AssignmentPatternBuilder {
  return new AssignmentPatternBuilder(left);
}

export interface AssignmentPatternOptions {
  left: Builder<Pattern>;
  right: Builder<Expression>;
}

export namespace assignment_pattern {
  export function from(options: AssignmentPatternOptions): AssignmentPatternBuilder {
    const b = new AssignmentPatternBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
