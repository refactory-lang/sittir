import { BaseBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LineComment } from '../types.js';


class LineCommentBuilder extends BaseBuilder<LineComment> {
  private _doc?: BaseBuilder;
  private _inner?: BaseBuilder;
  private _outer?: BaseBuilder;

  constructor() { super(); }

  doc(value: BaseBuilder): this {
    this._doc = value;
    return this;
  }

  inner(value: BaseBuilder): this {
    this._inner = value;
    return this;
  }

  outer(value: BaseBuilder): this {
    this._outer = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('//');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LineComment {
    return {
      kind: 'line_comment',
      doc: this._doc ? this.renderChild(this._doc, ctx) : undefined,
      inner: this._inner ? this.renderChild(this._inner, ctx) : undefined,
      outer: this._outer ? this.renderChild(this._outer, ctx) : undefined,
    } as unknown as LineComment;
  }

  override get nodeKind(): string { return 'line_comment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '//', type: '//' });
    return parts;
  }
}

export function line_comment(): LineCommentBuilder {
  return new LineCommentBuilder();
}
