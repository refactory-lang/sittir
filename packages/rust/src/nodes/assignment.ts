import type { BuilderTerminal } from '@sittir/types';
import type { AssignmentExpression, AssignmentExpressionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function assignmentExpression(config: AssignmentExpressionConfig): AssignmentExpression {
  return {
    kind: 'assignment_expression',
    ...config,
  } as AssignmentExpression;
}

class AssignmentBuilder implements BuilderTerminal<AssignmentExpression> {
  private _left: string = '';
  private _right: string = '';

  constructor(left: string) {
    this._left = left;
  }

  right(value: string): this {
    this._right = value;
    return this;
  }

  build(): AssignmentExpression {
    return assignmentExpression({
      left: this._left,
      right: this._right,
    } as AssignmentExpressionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function assignment(left: string): AssignmentBuilder {
  return new AssignmentBuilder(left);
}
