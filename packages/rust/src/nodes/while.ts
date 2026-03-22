import type { BuilderTerminal } from '@sittir/types';
import type { WhileExpression, WhileExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function whileExpression(config: WhileExpressionConfig): WhileExpression {
  return {
    kind: 'while_expression',
    ...config,
  } as WhileExpression;
}

class WhileBuilder implements BuilderTerminal<WhileExpression> {
  private _body: string = '';
  private _condition: string = '';
  private _children?: string;

  constructor(body: string) {
    this._body = body;
  }

  condition(value: string): this {
    this._condition = value;
    return this;
  }

  children(value: string): this {
    this._children = value;
    return this;
  }

  build(): WhileExpression {
    return whileExpression({
      body: this._body,
      condition: this._condition,
      children: this._children,
    } as WhileExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function while_(body: string): WhileBuilder {
  return new WhileBuilder(body);
}
