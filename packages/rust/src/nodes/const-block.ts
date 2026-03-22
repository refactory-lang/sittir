import type { BuilderTerminal } from '@sittir/types';
import type { ConstBlock, ConstBlockConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function constBlock(config: ConstBlockConfig): ConstBlock {
  return {
    kind: 'const_block',
    ...config,
  } as ConstBlock;
}

class ConstBlockBuilder implements BuilderTerminal<ConstBlock> {
  private _body: string = '';

  constructor(body: string) {
    this._body = body;
  }

  build(): ConstBlock {
    return constBlock({
      body: this._body,
    } as ConstBlockConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function const_block(body: string): ConstBlockBuilder {
  return new ConstBlockBuilder(body);
}
