import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AugmentedAssignmentExpression, Expression, Identifier, MemberExpression, NonNullExpression, ParenthesizedExpression, SubscriptExpression } from '../types.js';


class AugmentedAssignmentExpressionBuilder extends Builder<AugmentedAssignmentExpression> {
  private _left: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression>;
  private _operator!: Builder;
  private _right!: Builder<Expression>;

  constructor(left: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression>) {
    super();
    this._left = left;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<Expression>): this {
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
      left: this._left.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
    } as AugmentedAssignmentExpression;
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

export type { AugmentedAssignmentExpressionBuilder };

export function augmented_assignment_expression(left: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression>): AugmentedAssignmentExpressionBuilder {
  return new AugmentedAssignmentExpressionBuilder(left);
}

export interface AugmentedAssignmentExpressionOptions {
  left: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression>;
  operator: Builder;
  right: Builder<Expression>;
}

export namespace augmented_assignment_expression {
  export function from(options: AugmentedAssignmentExpressionOptions): AugmentedAssignmentExpressionBuilder {
    const b = new AugmentedAssignmentExpressionBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
