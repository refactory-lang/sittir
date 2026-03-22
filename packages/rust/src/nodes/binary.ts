import type { BuilderTerminal } from '@sittir/types';
import type { BinaryExpression, BinaryExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function binaryExpression(config: BinaryExpressionConfig): BinaryExpression {
  return {
    kind: 'binary_expression',
    ...config,
  } as BinaryExpression;
}

class BinaryBuilder implements BuilderTerminal<BinaryExpression> {
  private _left: string = '';
  private _operator: string = '';
  private _right: string = '';

  constructor(left: string) {
    this._left = left;
  }

  operator(value: string): this {
    this._operator = value;
    return this;
  }

  right(value: string): this {
    this._right = value;
    return this;
  }

  build(): BinaryExpression {
    return binaryExpression({
      left: this._left,
      operator: this._operator,
      right: this._right,
    } as BinaryExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function binary(left: string): BinaryBuilder {
  return new BinaryBuilder(left);
}
