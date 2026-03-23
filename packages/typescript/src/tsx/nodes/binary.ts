import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BinaryExpression, Expression, PrivatePropertyIdentifier } from '../types.js';


class BinaryBuilder extends Builder<BinaryExpression> {
  private _left: Builder<Expression | PrivatePropertyIdentifier>;
  private _operator!: Builder;
  private _right!: Builder<Expression>;

  constructor(left: Builder<Expression | PrivatePropertyIdentifier>) {
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

  build(ctx?: RenderContext): BinaryExpression {
    return {
      kind: 'binary_expression',
      left: this._left.build(ctx),
      operator: this._operator?.build(ctx),
      right: this._right?.build(ctx),
    } as BinaryExpression;
  }

  override get nodeKind(): string { return 'binary_expression'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { BinaryBuilder };

export function binary(left: Builder<Expression | PrivatePropertyIdentifier>): BinaryBuilder {
  return new BinaryBuilder(left);
}

export interface BinaryExpressionOptions {
  left: Builder<Expression | PrivatePropertyIdentifier>;
  operator: Builder;
  right: Builder<Expression>;
}

export namespace binary {
  export function from(options: BinaryExpressionOptions): BinaryBuilder {
    const b = new BinaryBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
