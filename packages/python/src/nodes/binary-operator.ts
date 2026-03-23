import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BinaryOperator, PrimaryExpression } from '../types.js';


class BinaryOperatorBuilder extends Builder<BinaryOperator> {
  private _left: Builder<PrimaryExpression>;
  private _operator!: Builder;
  private _right!: Builder<PrimaryExpression>;

  constructor(left: Builder<PrimaryExpression>) {
    super();
    this._left = left;
  }

  operator(value: Builder): this {
    this._operator = value;
    return this;
  }

  right(value: Builder<PrimaryExpression>): this {
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

  build(ctx?: RenderContext): BinaryOperator {
    return {
      kind: 'binary_operator',
      left: this._left.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
    } as BinaryOperator;
  }

  override get nodeKind(): string { return 'binary_operator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { BinaryOperatorBuilder };

export function binary_operator(left: Builder<PrimaryExpression>): BinaryOperatorBuilder {
  return new BinaryOperatorBuilder(left);
}

export interface BinaryOperatorOptions {
  left: Builder<PrimaryExpression>;
  operator: Builder;
  right: Builder<PrimaryExpression>;
}

export namespace binary_operator {
  export function from(options: BinaryOperatorOptions): BinaryOperatorBuilder {
    const b = new BinaryOperatorBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
