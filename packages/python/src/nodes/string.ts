import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Interpolation, String, StringContent, StringEnd, StringStart } from '../types.js';


class StringBuilder extends Builder<String> {
  private _children: Builder<Interpolation | StringContent | StringEnd | StringStart>[] = [];

  constructor(...children: Builder<Interpolation | StringContent | StringEnd | StringStart>[]) {
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

  override get nodeKind(): string { return 'string'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._children[2]) parts.push({ kind: 'builder', builder: this._children[2]! });
    return parts;
  }
}

export type { StringBuilder };

export function string(...children: Builder<Interpolation | StringContent | StringEnd | StringStart>[]): StringBuilder {
  return new StringBuilder(...children);
}

export interface StringOptions {
  children: Builder<Interpolation | StringContent | StringEnd | StringStart> | (Builder<Interpolation | StringContent | StringEnd | StringStart>)[];
}

export namespace string {
  export function from(options: StringOptions): StringBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new StringBuilder(..._arr);
    return b;
  }
}
