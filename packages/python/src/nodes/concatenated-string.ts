import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConcatenatedString, String } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';


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

  override get nodeKind(): 'concatenated_string' { return 'concatenated_string'; }

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
  nodeKind: 'concatenated_string';
  children?: Builder<String> | Omit<StringOptions, 'nodeKind'> | (Builder<String> | Omit<StringOptions, 'nodeKind'>)[];
}

export namespace concatenated_string {
  export function from(input: Omit<ConcatenatedStringOptions, 'nodeKind'> | Builder<String> | Omit<StringOptions, 'nodeKind'> | (Builder<String> | Omit<StringOptions, 'nodeKind'>)[]): ConcatenatedStringBuilder {
    const options: Omit<ConcatenatedStringOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ConcatenatedStringOptions, 'nodeKind'>
      : { children: input } as Omit<ConcatenatedStringOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new ConcatenatedStringBuilder(..._arr.map(_v => _v instanceof Builder ? _v : string.from(_v)));
    return b;
  }
}
