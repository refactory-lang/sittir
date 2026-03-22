import type { BuilderTerminal } from '@sittir/types';
import type { MatchBlock, MatchBlockConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function matchBlock(config: MatchBlockConfig): MatchBlock {
  return {
    kind: 'match_block',
    ...config,
  } as MatchBlock;
}

class MatchBlockBuilder implements BuilderTerminal<MatchBlock> {
  private _children: string[] = [];

  constructor() {}

  children(value: string[]): this {
    this._children = value;
    return this;
  }

  build(): MatchBlock {
    return matchBlock({
      children: this._children,
    } as MatchBlockConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function match_block(): MatchBlockBuilder {
  return new MatchBlockBuilder();
}
