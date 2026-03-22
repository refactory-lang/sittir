import type { BuilderTerminal } from '@sittir/types';
import type { TokenRepetition, TokenRepetitionConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tokenRepetition(config: TokenRepetitionConfig): TokenRepetition {
  return {
    kind: 'token_repetition',
    ...config,
  } as TokenRepetition;
}

class TokenRepetitionBuilder implements BuilderTerminal<TokenRepetition> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): TokenRepetition {
    return tokenRepetition({
      children: this._children,
    } as TokenRepetitionConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function token_repetition(): TokenRepetitionBuilder {
  return new TokenRepetitionBuilder();
}
