import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Identifier, MemberType } from '../types.js';


class MemberTypeBuilder extends Builder<MemberType> {
  private _children: Builder<Identifier>[] = [];

  constructor(...children: Builder<Identifier>[]) {
    super();
    this._children = children;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('.');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): MemberType {
    return {
      kind: 'member_type',
      children: this._children.map(c => c.build(ctx)),
    } as MemberType;
  }

  override get nodeKind(): string { return 'member_type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: '.', type: '.' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    return parts;
  }
}

export type { MemberTypeBuilder };

export function member_type(...children: Builder<Identifier>[]): MemberTypeBuilder {
  return new MemberTypeBuilder(...children);
}

export interface MemberTypeOptions {
  children: Builder<Identifier> | (Builder<Identifier>)[];
}

export namespace member_type {
  export function from(options: MemberTypeOptions): MemberTypeBuilder {
    const _children = options.children;
    const _arr = Array.isArray(_children) ? _children : [_children];
    const b = new MemberTypeBuilder(..._arr);
    return b;
  }
}
