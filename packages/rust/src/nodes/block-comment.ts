import type { BuilderTerminal } from '@sittir/types';
import type { BlockComment, BlockCommentConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function blockComment(config: BlockCommentConfig): BlockComment {
  return {
    kind: 'block_comment',
    ...config,
  } as BlockComment;
}

class BlockCommentBuilder implements BuilderTerminal<BlockComment> {
  private _doc?: string;
  private _inner?: string;
  private _outer?: string;

  constructor() {}

  doc(value: string): this {
    this._doc = value;
    return this;
  }

  inner(value: string): this {
    this._inner = value;
    return this;
  }

  outer(value: string): this {
    this._outer = value;
    return this;
  }

  build(): BlockComment {
    return blockComment({
      doc: this._doc,
      inner: this._inner,
      outer: this._outer,
    } as BlockCommentConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function block_comment(): BlockCommentBuilder {
  return new BlockCommentBuilder();
}
