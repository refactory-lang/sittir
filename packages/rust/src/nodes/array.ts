import type { BuilderTerminal } from '@sittir/types';
import type { ArrayExpression, ArrayExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function arrayExpression(config: ArrayExpressionConfig): ArrayExpression {
  return {
    kind: 'array_expression',
    ...config,
  } as ArrayExpression;
}

class ArrayBuilder implements BuilderTerminal<ArrayExpression> {
  private _length?: string;
  private _children: string[] = [];

  constructor() {}

  length(value: string): this {
    this._length = value;
    return this;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): ArrayExpression {
    return arrayExpression({
      length: this._length,
      children: this._children,
    } as ArrayExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function array(): ArrayBuilder {
  return new ArrayBuilder();
}
