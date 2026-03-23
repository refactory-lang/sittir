import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AugmentedAssignmentExpression } from '../types.js';

type Child = BaseBuilder<{ kind: string }>;

class AugmentedAssignmentBuilder extends BaseBuilder<AugmentedAssignmentExpression> {
  private _left: Child;
  private _operator!: Child;
  private _right!: Child;

  constructor(left: Child) {
    super();
    this._left = left;
  }

  operator(value: Child): this {
    this._operator = value;
    return this;
  }

  right(value: Child): this {
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

  build(ctx?: RenderContext): AugmentedAssignmentExpression {
    return {
      kind: 'augmented_assignment_expression',
      left: this.renderChild(this._left, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as AugmentedAssignmentExpression;
  }

  override get nodeKind(): string { return 'augmented_assignment_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export function augmented_assignment(left: Child): AugmentedAssignmentBuilder {
  return new AugmentedAssignmentBuilder(left);
}
