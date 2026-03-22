import type { BuilderTerminal } from '@sittir/types';
import type { WherePredicate, WherePredicateConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function wherePredicate(config: WherePredicateConfig): WherePredicate {
  return {
    kind: 'where_predicate',
    ...config,
  } as WherePredicate;
}

class WherePredicateBuilder implements BuilderTerminal<WherePredicate> {
  private _bounds: string = '';
  private _left: string = '';

  constructor(bounds: string) {
    this._bounds = bounds;
  }

  left(value: string): this {
    this._left = value;
    return this;
  }

  build(): WherePredicate {
    return wherePredicate({
      bounds: this._bounds,
      left: this._left,
    } as WherePredicateConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function where_predicate(bounds: string): WherePredicateBuilder {
  return new WherePredicateBuilder(bounds);
}
