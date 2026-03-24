import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AugmentedAssignmentExpression, Expression, Identifier, MemberExpression, NonNullExpression, ParenthesizedExpression, SubscriptExpression } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';
import { non_null_expression } from './non-null-expression.js';
import type { NonNullExpressionOptions } from './non-null-expression.js';


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
      operator: this._operator ? this.buildChild(this._operator, ctx) : undefined,
      right: this._right ? this._right.build(ctx) : undefined,
    } as AugmentedAssignmentExpression;
  }

  override get nodeKind(): 'augmented_assignment_expression' { return 'augmented_assignment_expression'; }

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
  nodeKind: 'augmented_assignment_expression';
  left: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ParenthesizedExpressionOptions | NonNullExpressionOptions;
  operator: Builder;
  right: Builder<Expression>;
}

export namespace augmented_assignment_expression {
  export function from(options: Omit<AugmentedAssignmentExpressionOptions, 'nodeKind'>): AugmentedAssignmentExpressionBuilder {
    const _raw = options.left;
    let _ctor: Builder<MemberExpression | SubscriptExpression | Identifier | ParenthesizedExpression | NonNullExpression>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'member_expression': _ctor = member_expression.from(_raw); break;
        case 'subscript_expression': _ctor = subscript_expression.from(_raw); break;
        case 'parenthesized_expression': _ctor = parenthesized_expression.from(_raw); break;
        case 'non_null_expression': _ctor = non_null_expression.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new AugmentedAssignmentExpressionBuilder(_ctor);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
