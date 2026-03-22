import type { BuilderTerminal } from '@sittir/types';
import type { CallExpression, CallExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function callExpression(config: CallExpressionConfig): CallExpression {
  return {
    kind: 'call_expression',
    ...config,
  } as CallExpression;
}

class CallBuilder implements BuilderTerminal<CallExpression> {
  private _arguments: string = '';
  private _function: string = '';

  constructor(arguments_: string) {
    this._arguments = arguments_;
  }

  function(value: string): this {
    this._function = value;
    return this;
  }

  build(): CallExpression {
    return callExpression({
      arguments: this._arguments,
      function: this._function,
    } as CallExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function call(arguments_: string): CallBuilder {
  return new CallBuilder(arguments_);
}
