import type { BuilderTerminal } from '@sittir/types';
import type { TokenBindingPattern, TokenBindingPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function tokenBindingPattern(config: TokenBindingPatternConfig): TokenBindingPattern {
  return {
    kind: 'token_binding_pattern',
    ...config,
  } as TokenBindingPattern;
}

class TokenBindingPatternBuilder implements BuilderTerminal<TokenBindingPattern> {
  private _name: string = '';
  private _type: string = '';

  constructor(name: string) {
    this._name = name;
  }

  type(value: string): this {
    this._type = value;
    return this;
  }

  build(): TokenBindingPattern {
    return tokenBindingPattern({
      name: this._name,
      type: this._type,
    } as TokenBindingPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function token_binding_pattern(name: string): TokenBindingPatternBuilder {
  return new TokenBindingPatternBuilder(name);
}
