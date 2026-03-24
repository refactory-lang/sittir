import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Interpolation, String, StringContent, StringEnd, StringStart } from '../types.js';
import { interpolation } from './interpolation.js';
import type { InterpolationOptions } from './interpolation.js';
import { string_content } from './string-content.js';
import type { StringContentOptions } from './string-content.js';


class StringBuilder extends Builder<String> {
  private _children: Builder<StringStart | Interpolation | StringContent | StringEnd>[] = [];

  constructor(...children: Builder<StringStart | Interpolation | StringContent | StringEnd>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._children[2]) parts.push(this.renderChild(this._children[2]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): String {
    return {
      kind: 'string',
      children: this._children.map(c => c.build(ctx)),
    } as String;
  }

  override get nodeKind(): 'string' { return 'string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { StringBuilder };

export function string(...children: Builder<StringStart | Interpolation | StringContent | StringEnd>[]): StringBuilder {
  return new StringBuilder(...children);
}

export interface StringOptions {
  nodeKind: 'string';
  children?: Builder<StringStart | Interpolation | StringContent | StringEnd> | InterpolationOptions | StringContentOptions | (Builder<StringStart | Interpolation | StringContent | StringEnd> | InterpolationOptions | StringContentOptions)[];
}

export namespace string {
  export function from(input: Omit<StringOptions, 'nodeKind'> | Builder<StringStart | Interpolation | StringContent | StringEnd> | InterpolationOptions | StringContentOptions | (Builder<StringStart | Interpolation | StringContent | StringEnd> | InterpolationOptions | StringContentOptions)[]): StringBuilder {
    const options: Omit<StringOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<StringOptions, 'nodeKind'>
      : { children: input } as Omit<StringOptions, 'nodeKind'>;
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new StringBuilder(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'interpolation': return interpolation.from(_v);   case 'string_content': return string_content.from(_v); } throw new Error('unreachable'); }));
    return b;
  }
}
