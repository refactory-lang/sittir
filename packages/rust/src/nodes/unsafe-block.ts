import type { BuilderTerminal } from '@sittir/types';
import type { UnsafeBlock, UnsafeBlockConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function unsafeBlock(config: UnsafeBlockConfig): UnsafeBlock {
  return {
    kind: 'unsafe_block',
    ...config,
  } as UnsafeBlock;
}

class UnsafeBlockBuilder implements BuilderTerminal<UnsafeBlock> {
  private _children: string;

  constructor(children: string) {
    this._children = children;
  }

  build(): UnsafeBlock {
    return unsafeBlock({
      children: this._children,
    } as UnsafeBlockConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function unsafe_block(children: string): UnsafeBlockBuilder {
  return new UnsafeBlockBuilder(children);
}
