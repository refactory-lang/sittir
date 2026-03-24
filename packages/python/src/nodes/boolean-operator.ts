import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BooleanOperator, Expression } from '../types.js';


class BooleanOperatorBuilder extends Builder<BooleanOperator> {
  private _left: Builder<Expression>;
  private _operator!: Builder;
  private _right!: Builder<Expression>;

  constructor(left: Builder<Expression>) {
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

  build(ctx?: RenderContext): BooleanOperator {
    return {
      kind: 'boolean_operator',
      left: this._left.build(ctx),
      operator: this._operator ? this.buildChild(this._operator, ctx) : undefined,
      right: this._right ? this._right.build(ctx) : undefined,
    } as BooleanOperator;
  }

  override get nodeKind(): 'boolean_operator' { return 'boolean_operator'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._left) parts.push({ kind: 'builder', builder: this._left, fieldName: 'left' });
    if (this._operator) parts.push({ kind: 'builder', builder: this._operator, fieldName: 'operator' });
    if (this._right) parts.push({ kind: 'builder', builder: this._right, fieldName: 'right' });
    return parts;
  }
}

export type { BooleanOperatorBuilder };

export function boolean_operator(left: Builder<Expression>): BooleanOperatorBuilder {
  return new BooleanOperatorBuilder(left);
}

export interface BooleanOperatorOptions {
  nodeKind: 'boolean_operator';
  left: Builder<Expression>;
  operator: Builder;
  right: Builder<Expression>;
}

export namespace boolean_operator {
  export function from(options: Omit<BooleanOperatorOptions, 'nodeKind'>): BooleanOperatorBuilder {
    const b = new BooleanOperatorBuilder(options.left);
    if (options.operator !== undefined) b.operator(options.operator);
    if (options.right !== undefined) b.right(options.right);
    return b;
  }
}
