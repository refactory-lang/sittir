import type { BuilderTerminal } from '@sittir/types';
import type { OrPattern, OrPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function orPattern(config: OrPatternConfig): OrPattern {
  return {
    kind: 'or_pattern',
    ...config,
  } as OrPattern;
}

class OrPatternBuilder implements BuilderTerminal<OrPattern> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): OrPattern {
    return orPattern({
      children: this._children,
    } as OrPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function or_pattern(children: string[]): OrPatternBuilder {
  return new OrPatternBuilder(children);
}
