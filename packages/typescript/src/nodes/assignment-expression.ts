import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ArrayPattern, AssignmentExpression, Expression, Identifier, MemberExpression, NonNullExpression, ObjectPattern, ParenthesizedExpression, SubscriptExpression, Undefined } from '../types.js';
import { member_expression } from './member-expression.js';
import type { MemberExpressionOptions } from './member-expression.js';
import { subscript_expression } from './subscript-expression.js';
import type { SubscriptExpressionOptions } from './subscript-expression.js';
import { object_pattern } from './object-pattern.js';
import type { ObjectPatternOptions } from './object-pattern.js';
import { array_pattern } from './array-pattern.js';
import type { ArrayPatternOptions } from './array-pattern.js';
import { non_null_expression } from './non-null-expression.js';
import type { NonNullExpressionOptions } from './non-null-expression.js';
import { parenthesized_expression } from './parenthesized-expression.js';
import type { ParenthesizedExpressionOptions } from './parenthesized-expression.js';


class AssignmentExpressionBuilder extends Builder<AssignmentExpression> {
  private _left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
  private _right!: Builder<Expression>;

  constructor(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>) {
    super();
    this._left = left;
  }

  right(value: Builder<Expression>): this {
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

  build(ctx?: RenderContext): AssignmentExpression {
    return {
      kind: 'assignment_expression',
      left: this._left.build(ctx),
      right: this._right ? this._right.build(ctx) : undefined,
    } as AssignmentExpression;
  }

  override get nodeKind(): 'assignment_expression' { return 'assignment_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { AssignmentExpressionBuilder };

export function assignment_expression(left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>): AssignmentExpressionBuilder {
  return new AssignmentExpressionBuilder(left);
}

export interface AssignmentExpressionOptions {
  nodeKind: 'assignment_expression';
  left: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression> | MemberExpressionOptions | SubscriptExpressionOptions | ObjectPatternOptions | ArrayPatternOptions | NonNullExpressionOptions | ParenthesizedExpressionOptions;
  right: Builder<Expression>;
}

export namespace assignment_expression {
  export function from(options: Omit<AssignmentExpressionOptions, 'nodeKind'>): AssignmentExpressionBuilder {
    const _raw = options.left;
    let _ctor: Builder<MemberExpression | SubscriptExpression | Undefined | Identifier | ObjectPattern | ArrayPattern | NonNullExpression | ParenthesizedExpression>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'member_expression': _ctor = member_expression.from(_raw); break;
        case 'subscript_expression': _ctor = subscript_expression.from(_raw); break;
        case 'object_pattern': _ctor = object_pattern.from(_raw); break;
        case 'array_pattern': _ctor = array_pattern.from(_raw); break;
        case 'non_null_expression': _ctor = non_null_expression.from(_raw); break;
        case 'parenthesized_expression': _ctor = parenthesized_expression.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new AssignmentExpressionBuilder(_ctor);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
