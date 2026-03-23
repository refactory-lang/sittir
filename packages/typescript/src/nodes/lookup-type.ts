import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { LookupType, PrimaryType, Type } from '../types.js';


class LookupTypeBuilder extends Builder<LookupType> {
  private _children: Builder<PrimaryType | Type>[] = [];

  constructor(...children: Builder<PrimaryType | Type>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('[');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    parts.push(']');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): LookupType {
    return {
      kind: 'lookup_type',
      children: this._children.map(c => c.build(ctx)),
    } as LookupType;
  }

  override get nodeKind(): string { return 'lookup_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '[', type: '[' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    parts.push({ kind: 'token', text: ']', type: ']' });
    return parts;
  }
}

export type { LookupTypeBuilder };

export function lookup_type(...children: Builder<PrimaryType | Type>[]): LookupTypeBuilder {
  return new LookupTypeBuilder(...children);
}

export interface LookupTypeOptions {
  children?: Builder<PrimaryType | Type> | (Builder<PrimaryType | Type>)[];
}

export namespace lookup_type {
  export function from(options: LookupTypeOptions): LookupTypeBuilder {
    const _children = options.children;
    const _arr = _children !== undefined ? (Array.isArray(_children) ? _children : [_children]) : [];
    const b = new LookupTypeBuilder(..._arr);
    return b;
  }
}
