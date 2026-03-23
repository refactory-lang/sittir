import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentExpression, Expression } from '../types.js';


class AssignmentExpressionBuilder extends Builder<AssignmentExpression> {
  private _left: Builder<Expression>;
  private _right!: Builder<Expression>;

  constructor(left: Builder<Expression>) {
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
      right: this._right?.build(ctx),
    } as AssignmentExpression;
  }

  override get nodeKind(): string { return 'assignment_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    parts.push({ kind: 'token', text: '=', type: '=' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { AssignmentExpressionBuilder };

export function assignment_expression(left: Builder<Expression>): AssignmentExpressionBuilder {
  return new AssignmentExpressionBuilder(left);
}

export interface AssignmentExpressionOptions {
  left: Builder<Expression>;
  right: Builder<Expression>;
}

export namespace assignment_expression {
  export function from(options: AssignmentExpressionOptions): AssignmentExpressionBuilder {
    const b = new AssignmentExpressionBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
