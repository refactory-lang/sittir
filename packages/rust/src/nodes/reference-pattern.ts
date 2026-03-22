import type { BuilderTerminal } from '@sittir/types';
import type { ReferencePattern, ReferencePatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function referencePattern(config: ReferencePatternConfig): ReferencePattern {
  return {
    kind: 'reference_pattern',
    ...config,
  } as ReferencePattern;
}

class ReferencePatternBuilder implements BuilderTerminal<ReferencePattern> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): ReferencePattern {
    return referencePattern({
      children: this._children,
    } as ReferencePatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function reference_pattern(children: string[]): ReferencePatternBuilder {
  return new ReferencePatternBuilder(children);
}
