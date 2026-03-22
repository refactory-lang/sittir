import type { BuilderTerminal } from '@sittir/types';
import type { RefPattern, RefPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function refPattern(config: RefPatternConfig): RefPattern {
  return {
    kind: 'ref_pattern',
    ...config,
  } as RefPattern;
}

class RefPatternBuilder implements BuilderTerminal<RefPattern> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): RefPattern {
    return refPattern({
      children: this._children,
    } as RefPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function ref_pattern(children: string): RefPatternBuilder {
  return new RefPatternBuilder(children);
}
