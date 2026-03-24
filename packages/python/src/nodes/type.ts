import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { ConstrainedType, Expression, GenericType, MemberType, SplatType, Type, UnionType } from '../types.js';
import { splat_type } from './splat-type.js';
import type { SplatTypeOptions } from './splat-type.js';
import { generic_type } from './generic-type.js';
import type { GenericTypeOptions } from './generic-type.js';
import { union_type } from './union-type.js';
import type { UnionTypeOptions } from './union-type.js';
import { constrained_type } from './constrained-type.js';
import type { ConstrainedTypeOptions } from './constrained-type.js';
import { member_type } from './member-type.js';
import type { MemberTypeOptions } from './member-type.js';


class TypeBuilder extends Builder<Type> {
  private _children: Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType>[] = [];

  constructor(children: Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType>) {
    super();
    this._children = [children];
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): Type {
    return {
      kind: 'type',
      children: this._children[0]!.build(ctx),
    } as Type;
  }

  override get nodeKind(): 'type' { return 'type'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    return parts;
  }
}

export type { TypeBuilder };

export function type_(children: Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType>): TypeBuilder {
  return new TypeBuilder(children);
}

export interface TypeOptions {
  nodeKind: 'type';
  children: Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType> | SplatTypeOptions | GenericTypeOptions | UnionTypeOptions | ConstrainedTypeOptions | MemberTypeOptions | (Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType> | SplatTypeOptions | GenericTypeOptions | UnionTypeOptions | ConstrainedTypeOptions | MemberTypeOptions)[];
}

export namespace type_ {
  export function from(input: Omit<TypeOptions, 'nodeKind'> | Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType> | SplatTypeOptions | GenericTypeOptions | UnionTypeOptions | ConstrainedTypeOptions | MemberTypeOptions | (Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType> | SplatTypeOptions | GenericTypeOptions | UnionTypeOptions | ConstrainedTypeOptions | MemberTypeOptions)[]): TypeBuilder {
    const options: Omit<TypeOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<TypeOptions, 'nodeKind'>
      : { children: input } as Omit<TypeOptions, 'nodeKind'>;
    const _ctor = Array.isArray(options.children) ? options.children[0]! : options.children;
    let _resolved: Builder<Expression | SplatType | GenericType | UnionType | ConstrainedType | MemberType>;
    if (_ctor instanceof Builder) {
      _resolved = _ctor;
    } else {
      switch (_ctor.nodeKind) {
        case 'splat_type': _resolved = splat_type.from(_ctor); break;
        case 'generic_type': _resolved = generic_type.from(_ctor); break;
        case 'union_type': _resolved = union_type.from(_ctor); break;
        case 'constrained_type': _resolved = constrained_type.from(_ctor); break;
        case 'member_type': _resolved = member_type.from(_ctor); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new TypeBuilder(_resolved);
    return b;
  }
}
