import type { BuilderTerminal } from '@sittir/types';
import type { CapturedPattern, CapturedPatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function capturedPattern(config: CapturedPatternConfig): CapturedPattern {
  return {
    kind: 'captured_pattern',
    ...config,
  } as CapturedPattern;
}

class CapturedPatternBuilder implements BuilderTerminal<CapturedPattern> {
  private _children: string[] = [];

  constructor(children: string[]) {
    this._children = children;
  }

  build(): CapturedPattern {
    return capturedPattern({
      children: this._children,
    } as CapturedPatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function captured_pattern(children: string[]): CapturedPatternBuilder {
  return new CapturedPatternBuilder(children);
}
