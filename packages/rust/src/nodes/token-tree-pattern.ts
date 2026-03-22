import type { BuilderTerminal } from '@sittir/types';
import type { TokenTreePattern, TokenTreePatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tokenTreePattern(config: TokenTreePatternConfig): TokenTreePattern {
  return {
    kind: 'token_tree_pattern',
    ...config,
  } as TokenTreePattern;
}

class TokenTreePatternBuilder implements BuilderTerminal<TokenTreePattern> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): TokenTreePattern {
    return tokenTreePattern({
      children: this._children,
    } as TokenTreePatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function token_tree_pattern(): TokenTreePatternBuilder {
  return new TokenTreePatternBuilder();
}
