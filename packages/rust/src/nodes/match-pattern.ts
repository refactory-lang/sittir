import type { BuilderTerminal } from '@sittir/types';
import type { MatchPattern, MatchPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function matchPattern(config: MatchPatternConfig): MatchPattern {
  return {
    kind: 'match_pattern',
    ...config,
  } as MatchPattern;
}

class MatchPatternBuilder implements BuilderTerminal<MatchPattern> {
  private _condition?: string;
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  condition(value: string): this {
    this._condition = value;
    return this;
  }

  build(): MatchPattern {
    return matchPattern({
      condition: this._condition,
      children: this._children,
    } as MatchPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function match_pattern(children: string): MatchPatternBuilder {
  return new MatchPatternBuilder(children);
}
