import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { DocComment, InnerDocCommentMarker, LineComment, OuterDocCommentMarker } from '../types.js';


class LineCommentBuilder extends Builder<LineComment> {
  private _doc?: Builder<DocComment>;
  private _inner?: Builder<InnerDocCommentMarker>;
  private _outer?: Builder<OuterDocCommentMarker>;

  constructor() { super(); }

  doc(value: Builder<DocComment>): this {
    this._doc = value;
    return this;
  }

  inner(value: Builder<InnerDocCommentMarker>): this {
    this._inner = value;
    return this;
  }

  outer(value: Builder<OuterDocCommentMarker>): this {
    this._outer = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('//');
    if (this._doc) parts.push(this.renderChild(this._doc, ctx));
    if (this._inner) parts.push(this.renderChild(this._inner, ctx));
    if (this._outer) parts.push(this.renderChild(this._outer, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LineComment {
    return {
      kind: 'line_comment',
      doc: this._doc?.build(ctx),
      inner: this._inner?.build(ctx),
      outer: this._outer?.build(ctx),
    } as LineComment;
  }

  override get nodeKind(): string { return 'line_comment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '//', type: '//' });
    if (this._doc) parts.push({ kind: 'builder', builder: this._doc, fieldName: 'doc' });
    if (this._inner) parts.push({ kind: 'builder', builder: this._inner, fieldName: 'inner' });
    if (this._outer) parts.push({ kind: 'builder', builder: this._outer, fieldName: 'outer' });
    return parts;
  }
}

export type { LineCommentBuilder };

export function line_comment(): LineCommentBuilder {
  return new LineCommentBuilder();
}

export interface LineCommentOptions {
  doc?: Builder<DocComment> | string;
  inner?: Builder<InnerDocCommentMarker> | string;
  outer?: Builder<OuterDocCommentMarker> | string;
}

export namespace line_comment {
  export function from(options: LineCommentOptions): LineCommentBuilder {
    const b = new LineCommentBuilder();
    if (options.doc !== undefined) {
      const _v = options.doc;
      b.doc(typeof _v === 'string' ? new LeafBuilder('doc_comment', _v) : _v);
    }
    if (options.inner !== undefined) {
      const _v = options.inner;
      b.inner(typeof _v === 'string' ? new LeafBuilder('inner_doc_comment_marker', _v) : _v);
    }
    if (options.outer !== undefined) {
      const _v = options.outer;
      b.outer(typeof _v === 'string' ? new LeafBuilder('outer_doc_comment_marker', _v) : _v);
    }
    return b;
  }
}
