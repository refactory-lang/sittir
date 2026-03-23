import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConcatenatedString, String } from '../types.js';


class ConcatenatedStringBuilder extends Builder<ConcatenatedString> {
  private _children: Builder<String>[] = [];

  constructor(...children: Builder<String>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ConcatenatedString {
    return {
      kind: 'concatenated_string',
      children: this._children.map(c => c.build(ctx)),
    } as ConcatenatedString;
  }

  override get nodeKind(): string { return 'concatenated_string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { ConcatenatedStringBuilder };

export function concatenated_string(...children: Builder<String>[]): ConcatenatedStringBuilder {
  return new ConcatenatedStringBuilder(...children);
}

export interface ConcatenatedStringOptions {
  children: Builder<String> | (Builder<String>)[];
}

export namespace concatenated_string {
  export function from(options: ConcatenatedStringOptions): ConcatenatedStringBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new ConcatenatedStringBuilder(..._arr);
    return b;
  }
}
