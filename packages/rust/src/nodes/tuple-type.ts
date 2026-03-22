import type { BuilderTerminal } from '@sittir/types';
import type { TupleType, TupleTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tupleType(config: TupleTypeConfig): TupleType {
  return {
    kind: 'tuple_type',
    ...config,
  } as TupleType;
}

class TupleTypeBuilder implements BuilderTerminal<TupleType> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): TupleType {
    return tupleType({
      children: this._children,
    } as TupleTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function tuple_type(children: string[]): TupleTypeBuilder {
  return new TupleTypeBuilder(children);
}
