import type { BuilderTerminal } from '@sittir/types';
import type { TuplePattern, TuplePatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tuplePattern(config: TuplePatternConfig): TuplePattern {
  return {
    kind: 'tuple_pattern',
    ...config,
  } as TuplePattern;
}

class TuplePatternBuilder implements BuilderTerminal<TuplePattern> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): TuplePattern {
    return tuplePattern({
      children: this._children,
    } as TuplePatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function tuple_pattern(): TuplePatternBuilder {
  return new TuplePatternBuilder();
}
