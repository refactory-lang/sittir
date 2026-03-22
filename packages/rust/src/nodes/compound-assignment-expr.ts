import type { BuilderTerminal } from '@sittir/types';
import type { CompoundAssignmentExpr, CompoundAssignmentExprConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function compoundAssignmentExpr(config: CompoundAssignmentExprConfig): CompoundAssignmentExpr {
  return {
    kind: 'compound_assignment_expr',
    ...config,
  } as CompoundAssignmentExpr;
}

class CompoundAssignmentExprBuilder implements BuilderTerminal<CompoundAssignmentExpr> {
  private _left: string = '';
  private _operator: string = '';
  private _right: string = '';

  constructor(left: string) {
    this._left = left;
  }

  operator(value: string): this {
    this._operator = value;
    return this;
  }

  right(value: string): this {
    this._right = value;
    return this;
  }

  build(): CompoundAssignmentExpr {
    return compoundAssignmentExpr({
      left: this._left,
      operator: this._operator,
      right: this._right,
    } as CompoundAssignmentExprConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function compound_assignment_expr(left: string): CompoundAssignmentExprBuilder {
  return new CompoundAssignmentExprBuilder(left);
}
