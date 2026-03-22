import type { BuilderTerminal } from '@sittir/types';
import type { LineComment, LineCommentConfig } from '../types.js';
import { renderSilent } from '../render.js';
import { assertValid } from '../validate-fast.js';

export function lineComment(config: LineCommentConfig): LineComment {
  return {
    kind: 'line_comment',
    ...config,
  } as LineComment;
}

class LineCommentBuilder implements BuilderTerminal<LineComment> {
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

  build(): LineComment {
    return lineComment({
      doc: this._doc,
      inner: this._inner,
      outer: this._outer,
    } as LineCommentConfig);
  }

  render(): string {
    return assertValid(renderSilent(this.build()));
  }

  renderSilent(): string {
    return renderSilent(this.build());
  }
}

export function line_comment(): LineCommentBuilder {
  return new LineCommentBuilder();
}
