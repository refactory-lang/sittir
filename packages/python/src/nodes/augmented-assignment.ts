import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Assignment, AugmentedAssignment, Expression, ExpressionList, Pattern, PatternList } from '../types.js';


class AugmentedAssignmentBuilder extends Builder<AugmentedAssignment> {
  private _left: Builder<Pattern | PatternList>;
  private _operator!: Builder;
  private _right!: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>;

  constructor(left: Builder<Pattern | PatternList>) {
    super();
    this._left = left;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>): this {
    this._right = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._left) parts.push(this.renderChild(this._left, ctx));
    if (this._operator) parts.push(this.renderChild(this._operator, ctx));
    if (this._right) parts.push(this.renderChild(this._right, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AugmentedAssignment {
    return {
      kind: 'augmented_assignment',
      left: this._left.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
    } as AugmentedAssignment;
  }

  override get nodeKind(): string { return 'augmented_assignment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { AugmentedAssignmentBuilder };

export function augmented_assignment(left: Builder<Pattern | PatternList>): AugmentedAssignmentBuilder {
  return new AugmentedAssignmentBuilder(left);
}

export interface AugmentedAssignmentOptions {
  left: Builder<Pattern | PatternList>;
  operator: Builder;
  right: Builder<Assignment | AugmentedAssignment | Expression | ExpressionList | PatternList>;
}

export namespace augmented_assignment {
  export function from(options: AugmentedAssignmentOptions): AugmentedAssignmentBuilder {
    const b = new AugmentedAssignmentBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
