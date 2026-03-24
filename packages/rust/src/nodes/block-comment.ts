import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { BlockComment, DocComment, InnerDocCommentMarker, OuterDocCommentMarker } from '../types.js';


class BlockCommentBuilder extends Builder<BlockComment> {
  private _outer?: Builder<OuterDocCommentMarker>;
  private _inner?: Builder<InnerDocCommentMarker>;
  private _doc?: Builder<DocComment>;

  constructor() { super(); }

  outer(value: Builder<OuterDocCommentMarker>): this {
    this._outer = value;
    return this;
  }

  inner(value: Builder<InnerDocCommentMarker>): this {
    this._inner = value;
    return this;
  }

  doc(value: Builder<DocComment>): this {
    this._doc = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('/*');
    if (this._outer) parts.push(this.renderChild(this._outer, ctx));
    if (this._doc) parts.push(this.renderChild(this._doc, ctx));
    parts.push('*/');
    if (this._inner) parts.push(this.renderChild(this._inner, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): BlockComment {
    return {
      kind: 'block_comment',
      outer: this._outer ? this._outer.build(ctx) : undefined,
      inner: this._inner ? this._inner.build(ctx) : undefined,
      doc: this._doc ? this._doc.build(ctx) : undefined,
    } as BlockComment;
  }

  override get nodeKind(): 'block_comment' { return 'block_comment'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '/*', type: '/*' });
    if (this._outer) parts.push({ kind: 'builder', builder: this._outer, fieldName: 'outer' });
    if (this._doc) parts.push({ kind: 'builder', builder: this._doc, fieldName: 'doc' });
    parts.push({ kind: 'token', text: '*/', type: '*/' });
    if (this._inner) parts.push({ kind: 'builder', builder: this._inner, fieldName: 'inner' });
    return parts;
  }
}

export type { BlockCommentBuilder };

export function block_comment(): BlockCommentBuilder {
  return new BlockCommentBuilder();
}

export interface BlockCommentOptions {
  nodeKind: 'block_comment';
  outer?: Builder<OuterDocCommentMarker> | string;
  inner?: Builder<InnerDocCommentMarker> | string;
  doc?: Builder<DocComment> | string;
}

export namespace block_comment {
  export function from(options: Omit<BlockCommentOptions, 'nodeKind'>): BlockCommentBuilder {
    const b = new BlockCommentBuilder();
    if (options.outer !== undefined) {
      const _v = options.outer;
      b.outer(typeof _v === 'string' ? new LeafBuilder('outer_doc_comment_marker', _v) : _v);
    }
    if (options.inner !== undefined) {
      const _v = options.inner;
      b.inner(typeof _v === 'string' ? new LeafBuilder('inner_doc_comment_marker', _v) : _v);
    }
    if (options.doc !== undefined) {
      const _v = options.doc;
      b.doc(typeof _v === 'string' ? new LeafBuilder('doc_comment', _v) : _v);
    }
    return b;
  }
}
