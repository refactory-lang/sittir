import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { CompoundAssignmentExpr, Expression } from '../types.js';


class CompoundAssignmentExprBuilder extends Builder<CompoundAssignmentExpr> {
  private _left: Builder;
  private _operator!: Builder;
  private _right!: Builder;

  constructor(left: Builder) {
    super();
    this._left = left;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder): this {
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

  build(ctx?: RenderContext): CompoundAssignmentExpr {
    return {
      kind: 'compound_assignment_expr',
      left: this.renderChild(this._left, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as CompoundAssignmentExpr;
  }

  override get nodeKind(): string { return 'compound_assignment_expr'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { CompoundAssignmentExprBuilder };

export function compound_assignment_expr(left: Builder): CompoundAssignmentExprBuilder {
  return new CompoundAssignmentExprBuilder(left);
}

export interface CompoundAssignmentExprOptions {
  left: Builder<Expression>;
  operator: Builder;
  right: Builder<Expression>;
}

export namespace compound_assignment_expr {
  export function from(options: CompoundAssignmentExprOptions): CompoundAssignmentExprBuilder {
    const b = new CompoundAssignmentExprBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
