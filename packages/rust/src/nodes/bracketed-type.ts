import type { BuilderTerminal } from '@sittir/types';
import type { BracketedType, BracketedTypeConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function bracketedType(config: BracketedTypeConfig): BracketedType {
  return {
    kind: 'bracketed_type',
    ...config,
  } as BracketedType;
}

class BracketedTypeBuilder implements BuilderTerminal<BracketedType> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): BracketedType {
    return bracketedType({
      children: this._children,
    } as BracketedTypeConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function bracketed_type(children: string): BracketedTypeBuilder {
  return new BracketedTypeBuilder(children);
}
