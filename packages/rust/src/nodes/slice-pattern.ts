import type { BuilderTerminal } from '@sittir/types';
import type { SlicePattern, SlicePatternConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function slicePattern(config: SlicePatternConfig): SlicePattern {
  return {
    kind: 'slice_pattern',
    ...config,
  } as SlicePattern;
}

class SlicePatternBuilder implements BuilderTerminal<SlicePattern> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): SlicePattern {
    return slicePattern({
      children: this._children,
    } as SlicePatternConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function slice_pattern(): SlicePatternBuilder {
  return new SlicePatternBuilder();
}
