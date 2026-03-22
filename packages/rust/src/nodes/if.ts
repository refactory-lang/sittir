import type { BuilderTerminal } from '@sittir/types';
import type { IfExpression, IfExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function ifExpression(config: IfExpressionConfig): IfExpression {
  return {
    kind: 'if_expression',
    ...config,
  } as IfExpression;
}

class IfBuilder implements BuilderTerminal<IfExpression> {
  private _alternative?: string;
  private _condition: string = '';
  private _consequence: string = '';

  constructor(condition: string) {
    this._condition = condition;
  }

  alternative(value: string): this {
    this._alternative = value;
    return this;
  }

  consequence(value: string): this {
    this._consequence = value;
    return this;
  }

  build(): IfExpression {
    return ifExpression({
      alternative: this._alternative,
      condition: this._condition,
      consequence: this._consequence,
    } as IfExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function if_(condition: string): IfBuilder {
  return new IfBuilder(condition);
}
