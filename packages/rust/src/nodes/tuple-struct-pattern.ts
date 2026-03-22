import type { BuilderTerminal } from '@sittir/types';
import type { TupleStructPattern, TupleStructPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tupleStructPattern(config: TupleStructPatternConfig): TupleStructPattern {
  return {
    kind: 'tuple_struct_pattern',
    ...config,
  } as TupleStructPattern;
}

class TupleStructPatternBuilder implements BuilderTerminal<TupleStructPattern> {
  private _type: string = '';
  private _children: string[] = [];

  constructor(type_: string) {
    this._type = type_;
  }

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): TupleStructPattern {
    return tupleStructPattern({
      type: this._type,
      children: this._children,
    } as TupleStructPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function tuple_struct_pattern(type_: string): TupleStructPatternBuilder {
  return new TupleStructPatternBuilder(type_);
}
