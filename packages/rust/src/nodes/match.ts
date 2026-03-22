import type { BuilderTerminal } from '@sittir/types';
import type { MatchExpression, MatchExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function matchExpression(config: MatchExpressionConfig): MatchExpression {
  return {
    kind: 'match_expression',
    ...config,
  } as MatchExpression;
}

class MatchBuilder implements BuilderTerminal<MatchExpression> {
  private _body: string = '';
  private _value: string = '';

  constructor(body: string) {
    this._body = body;
  }

  value(value: string): this {
    this._value = value;
    return this;
  }

  build(): MatchExpression {
    return matchExpression({
      body: this._body,
      value: this._value,
    } as MatchExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function match(body: string): MatchBuilder {
  return new MatchBuilder(body);
}
