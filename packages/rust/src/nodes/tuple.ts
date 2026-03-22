import type { BuilderTerminal } from '@sittir/types';
import type { TupleExpression, TupleExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tupleExpression(config: TupleExpressionConfig): TupleExpression {
  return {
    kind: 'tuple_expression',
    ...config,
  } as TupleExpression;
}

class TupleBuilder implements BuilderTerminal<TupleExpression> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): TupleExpression {
    return tupleExpression({
      children: this._children,
    } as TupleExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function tuple(children: string[]): TupleBuilder {
  return new TupleBuilder(children);
}
