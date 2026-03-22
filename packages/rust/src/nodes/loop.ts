import type { BuilderTerminal } from '@sittir/types';
import type { LoopExpression, LoopExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function loopExpression(config: LoopExpressionConfig): LoopExpression {
  return {
    kind: 'loop_expression',
    ...config,
  } as LoopExpression;
}

class LoopBuilder implements BuilderTerminal<LoopExpression> {
  private _body: string = '';
  private _children?: string;

  constructor(body: string) {
    this._body = body;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): LoopExpression {
    return loopExpression({
      body: this._body,
      children: this._children,
    } as LoopExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function loop(body: string): LoopBuilder {
  return new LoopBuilder(body);
}
