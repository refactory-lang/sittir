import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BinaryExpression } from '../types.js';


class BinaryBuilder extends BaseBuilder<BinaryExpression> {
  private _left: BaseBuilder;
  private _operator!: BaseBuilder;
  private _right!: BaseBuilder;

  constructor(left: BaseBuilder) {
    super();
    this._left = left;
  }

  operator(value: BaseBuilder): this {
    this._operator = value;
    return this;
  }

  right(value: BaseBuilder): this {
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
      left: this.renderChild(this._left, ctx),
      operator: this._operator ? this.renderChild(this._operator, ctx) : undefined,
      right: this._right ? this.renderChild(this._right, ctx) : undefined,
    } as unknown as BinaryExpression;
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

export function binary(left: BaseBuilder): BinaryBuilder {
  return new BinaryBuilder(left);
}
