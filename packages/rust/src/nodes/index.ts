import type { BuilderTerminal } from '@sittir/types';
import type { IndexExpression, IndexExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function indexExpression(config: IndexExpressionConfig): IndexExpression {
  return {
    kind: 'index_expression',
    ...config,
  } as IndexExpression;
}

class IndexBuilder implements BuilderTerminal<IndexExpression> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): IndexExpression {
    return indexExpression({
      children: this._children,
    } as IndexExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function index(children: string[]): IndexBuilder {
  return new IndexBuilder(children);
}
