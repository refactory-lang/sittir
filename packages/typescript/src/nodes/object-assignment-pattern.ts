import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, Expression, ObjectAssignmentPattern, ObjectPattern, ShorthandPropertyIdentifierPattern } from '../types.js';


class ObjectAssignmentPatternBuilder extends Builder<ObjectAssignmentPattern> {
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

  build(ctx?: RenderContext): ObjectAssignmentPattern {
    return {
      kind: 'object_assignment_pattern',
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as ObjectAssignmentPattern;
  }

  override get nodeKind(): string { return 'object_assignment_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { ObjectAssignmentPatternBuilder };

export function object_assignment_pattern(left: Builder): ObjectAssignmentPatternBuilder {
  return new ObjectAssignmentPatternBuilder(left);
}

export interface ObjectAssignmentPatternOptions {
  left: Builder<ArrayPattern | ObjectPattern | ShorthandPropertyIdentifierPattern>;
  right: Builder<Expression>;
}

export namespace object_assignment_pattern {
  export function from(options: ObjectAssignmentPatternOptions): ObjectAssignmentPatternBuilder {
    const b = new ObjectAssignmentPatternBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
