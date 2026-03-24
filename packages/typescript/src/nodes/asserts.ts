import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { Asserts, Identifier, This, TypePredicate } from '../types.js';
import { type_predicate } from './type-predicate.js';
import type { TypePredicateOptions } from './type-predicate.js';


class AssertsBuilder extends Builder<Asserts> {
  private _children: Builder<TypePredicate | Identifier | This>[] = [];

  constructor(children: Builder<TypePredicate | Identifier | This>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('asserts');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Asserts {
    return {
      kind: 'asserts',
      children: this._children[0]!.build(ctx),
    } as Asserts;
  }

  override get nodeKind(): 'asserts' { return 'asserts'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: 'asserts', type: 'asserts' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { AssertsBuilder };

export function asserts(children: Builder<TypePredicate | Identifier | This>): AssertsBuilder {
  return new AssertsBuilder(children);
}

export interface AssertsOptions {
  nodeKind: 'asserts';
  children: Builder<TypePredicate | Identifier | This> | LeafOptions<'identifier'> | LeafOptions<'this'> | TypePredicateOptions | (Builder<TypePredicate | Identifier | This> | LeafOptions<'identifier'> | LeafOptions<'this'> | TypePredicateOptions)[];
}

export namespace asserts {
  export function from(input: Omit<AssertsOptions, 'nodeKind'> | Builder<TypePredicate | Identifier | This> | LeafOptions<'identifier'> | LeafOptions<'this'> | TypePredicateOptions | (Builder<TypePredicate | Identifier | This> | LeafOptions<'identifier'> | LeafOptions<'this'> | TypePredicateOptions)[]): AssertsBuilder {
    const options: Omit<AssertsOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<AssertsOptions, 'nodeKind'>
      : { children: input } as Omit<AssertsOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<TypePredicate | Identifier | This>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'type_predicate': _resolved = type_predicate.from(_ctor); break;
        case 'identifier': _resolved = new LeafBuilder('identifier', (_ctor as LeafOptions).text!); break;
        case 'this': _resolved = new LeafBuilder('this', (_ctor as LeafOptions).text ?? 'this'); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new AssertsBuilder(_resolved);
    return b;
  }
}
