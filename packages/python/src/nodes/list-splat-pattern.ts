import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { Attribute, Identifier, ListSplatPattern, Subscript } from '../types.js';
import { subscript } from './subscript.js';
import type { SubscriptOptions } from './subscript.js';
import { attribute } from './attribute.js';
import type { AttributeOptions } from './attribute.js';


class ListSplatPatternBuilder extends Builder<ListSplatPattern> {
  private _children: Builder<Identifier | Subscript | Attribute>[] = [];

  constructor(children: Builder<Identifier | Subscript | Attribute>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('*');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): ListSplatPattern {
    return {
      kind: 'list_splat_pattern',
      children: this._children[0]!.build(ctx),
    } as ListSplatPattern;
  }

  override get nodeKind(): 'list_splat_pattern' { return 'list_splat_pattern'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '*', type: '*' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { ListSplatPatternBuilder };

export function list_splat_pattern(children: Builder<Identifier | Subscript | Attribute>): ListSplatPatternBuilder {
  return new ListSplatPatternBuilder(children);
}

export interface ListSplatPatternOptions {
  nodeKind: 'list_splat_pattern';
  children: Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions | (Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions)[];
}

export namespace list_splat_pattern {
  export function from(input: Omit<ListSplatPatternOptions, 'nodeKind'> | Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions | (Builder<Identifier | Subscript | Attribute> | SubscriptOptions | AttributeOptions)[]): ListSplatPatternBuilder {
    const options: Omit<ListSplatPatternOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<ListSplatPatternOptions, 'nodeKind'>
      : { children: input } as Omit<ListSplatPatternOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<Identifier | Subscript | Attribute>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'subscript': _resolved = subscript.from(_ctor); break;
        case 'attribute': _resolved = attribute.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new ListSplatPatternBuilder(_resolved);
    return b;
  }
}
