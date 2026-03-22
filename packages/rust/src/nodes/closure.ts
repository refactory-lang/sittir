import type { BuilderTerminal } from '@sittir/types';
import type { ClosureExpression, ClosureExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function closureExpression(config: ClosureExpressionConfig): ClosureExpression {
  return {
    kind: 'closure_expression',
    ...config,
  } as ClosureExpression;
}

class ClosureBuilder implements BuilderTerminal<ClosureExpression> {
  private _body: string = '';
  private _parameters: string = '';
  private _returnType?: string;

  constructor(body: string) {
    this._body = body;
  }

  parameters(value: string): this {
    this._parameters = value;
    return this;
  }

  returnType(value: string): this {
    this._returnType = value;
    return this;
  }

  build(): ClosureExpression {
    return closureExpression({
      body: this._body,
      parameters: this._parameters,
      returnType: this._returnType,
    } as ClosureExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function closure(body: string): ClosureBuilder {
  return new ClosureBuilder(body);
}
