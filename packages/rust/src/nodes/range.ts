import type { BuilderTerminal } from '@sittir/types';
import type { RangeExpression, RangeExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function rangeExpression(config: RangeExpressionConfig): RangeExpression {
  return {
    kind: 'range_expression',
    ...config,
  } as RangeExpression;
}

class RangeBuilder implements BuilderTerminal<RangeExpression> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): RangeExpression {
    return rangeExpression({
      children: this._children,
    } as RangeExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function range(): RangeBuilder {
  return new RangeBuilder();
}
