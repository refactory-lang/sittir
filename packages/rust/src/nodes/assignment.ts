import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssignmentExpression, Expression } from '../types.js';


class AssignmentBuilder extends Builder<AssignmentExpression> {
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

  build(ctx?: RenderContext): AssignmentExpression {
    return {
      kind: 'assignment_expression',
      left: this.renderChild(this._left, ctx),
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as AssignmentExpression;
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

export type { AssignmentBuilder };

export function assignment(left: Builder): AssignmentBuilder {
  return new AssignmentBuilder(left);
}

export interface AssignmentExpressionOptions {
  left: Builder<Expression>;
  right: Builder<Expression>;
}

export namespace assignment {
  export function from(options: AssignmentExpressionOptions): AssignmentBuilder {
    const b = new AssignmentBuilder(options.left);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
