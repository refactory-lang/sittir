import { Builder } from '@sittir/types';
import type { RenderContext, CSTChild } from '@sittir/types';
import type { AssociatedType, AttributeItem, ConstItem, DeclarationList, EmptyStatement, EnumItem, ExternCrateDeclaration, ForeignModItem, FunctionItem, FunctionSignatureItem, ImplItem, InnerAttributeItem, LetDeclaration, MacroDefinition, MacroInvocation, ModItem, StaticItem, StructItem, TraitItem, TypeItem, UnionItem, UseDeclaration } from '../types.js';
import { const_ } from './const.js';
import type { ConstItemOptions } from './const.js';
import { macro_invocation } from './macro-invocation.js';
import type { MacroInvocationOptions } from './macro-invocation.js';
import { macro_definition } from './macro-definition.js';
import type { MacroDefinitionOptions } from './macro-definition.js';
import { attribute } from './attribute-item.js';
import type { AttributeItemOptions } from './attribute-item.js';
import { inner_attribute } from './inner-attribute.js';
import type { InnerAttributeItemOptions } from './inner-attribute.js';
import { mod } from './mod.js';
import type { ModItemOptions } from './mod.js';
import { foreign_mod } from './foreign-mod.js';
import type { ForeignModItemOptions } from './foreign-mod.js';
import { struct_ } from './struct.js';
import type { StructItemOptions } from './struct.js';
import { union } from './union.js';
import type { UnionItemOptions } from './union.js';
import { enum_ } from './enum.js';
import type { EnumItemOptions } from './enum.js';
import { type_ } from './type.js';
import type { TypeItemOptions } from './type.js';
import { function_ } from './function.js';
import type { FunctionItemOptions } from './function.js';
import { function_signature } from './function-signature.js';
import type { FunctionSignatureItemOptions } from './function-signature.js';
import { impl } from './impl.js';
import type { ImplItemOptions } from './impl.js';
import { trait } from './trait.js';
import type { TraitItemOptions } from './trait.js';
import { associated_type } from './associated-type.js';
import type { AssociatedTypeOptions } from './associated-type.js';
import { let_declaration } from './let-declaration.js';
import type { LetDeclarationOptions } from './let-declaration.js';
import { use_declaration } from './use-declaration.js';
import type { UseDeclarationOptions } from './use-declaration.js';
import { extern_crate_declaration } from './extern-crate-declaration.js';
import type { ExternCrateDeclarationOptions } from './extern-crate-declaration.js';
import { static_ } from './static.js';
import type { StaticItemOptions } from './static.js';


class DeclarationListBuilder extends Builder<DeclarationList> {
  private _children: Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem>[] = [];

  constructor() { super(); }

  children(...value: Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    parts.push('{');
    if (this._children.length > 0) parts.push(this.renderChildren(this._children, ' ', ctx));
    parts.push('}');
    return parts.join(' ');
  }

  build(ctx?: RenderContext): DeclarationList {
    return {
      kind: 'declaration_list',
      children: this._children.map(c => c.build(ctx)),
    } as DeclarationList;
  }

  override get nodeKind(): 'declaration_list' { return 'declaration_list'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    parts.push({ kind: 'token', text: '{', type: '{' });
    for (const child of this._children) {
      parts.push({ kind: 'builder', builder: child });
    }
    parts.push({ kind: 'token', text: '}', type: '}' });
    return parts;
  }
}

export type { DeclarationListBuilder };

export function declaration_list(): DeclarationListBuilder {
  return new DeclarationListBuilder();
}

export interface DeclarationListOptions {
  nodeKind: 'declaration_list';
  children?: Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem> | ConstItemOptions | MacroInvocationOptions | MacroDefinitionOptions | AttributeItemOptions | InnerAttributeItemOptions | ModItemOptions | ForeignModItemOptions | StructItemOptions | UnionItemOptions | EnumItemOptions | TypeItemOptions | FunctionItemOptions | FunctionSignatureItemOptions | ImplItemOptions | TraitItemOptions | AssociatedTypeOptions | LetDeclarationOptions | UseDeclarationOptions | ExternCrateDeclarationOptions | StaticItemOptions | (Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem> | ConstItemOptions | MacroInvocationOptions | MacroDefinitionOptions | AttributeItemOptions | InnerAttributeItemOptions | ModItemOptions | ForeignModItemOptions | StructItemOptions | UnionItemOptions | EnumItemOptions | TypeItemOptions | FunctionItemOptions | FunctionSignatureItemOptions | ImplItemOptions | TraitItemOptions | AssociatedTypeOptions | LetDeclarationOptions | UseDeclarationOptions | ExternCrateDeclarationOptions | StaticItemOptions)[];
}

export namespace declaration_list {
  export function from(input: Omit<DeclarationListOptions, 'nodeKind'> | Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem> | ConstItemOptions | MacroInvocationOptions | MacroDefinitionOptions | AttributeItemOptions | InnerAttributeItemOptions | ModItemOptions | ForeignModItemOptions | StructItemOptions | UnionItemOptions | EnumItemOptions | TypeItemOptions | FunctionItemOptions | FunctionSignatureItemOptions | ImplItemOptions | TraitItemOptions | AssociatedTypeOptions | LetDeclarationOptions | UseDeclarationOptions | ExternCrateDeclarationOptions | StaticItemOptions | (Builder<ConstItem | MacroInvocation | MacroDefinition | EmptyStatement | AttributeItem | InnerAttributeItem | ModItem | ForeignModItem | StructItem | UnionItem | EnumItem | TypeItem | FunctionItem | FunctionSignatureItem | ImplItem | TraitItem | AssociatedType | LetDeclaration | UseDeclaration | ExternCrateDeclaration | StaticItem> | ConstItemOptions | MacroInvocationOptions | MacroDefinitionOptions | AttributeItemOptions | InnerAttributeItemOptions | ModItemOptions | ForeignModItemOptions | StructItemOptions | UnionItemOptions | EnumItemOptions | TypeItemOptions | FunctionItemOptions | FunctionSignatureItemOptions | ImplItemOptions | TraitItemOptions | AssociatedTypeOptions | LetDeclarationOptions | UseDeclarationOptions | ExternCrateDeclarationOptions | StaticItemOptions)[]): DeclarationListBuilder {
    const options: Omit<DeclarationListOptions, 'nodeKind'> = typeof input === 'object' && input !== null && !Array.isArray(input) && !(input instanceof Builder) && 'children' in input
      ? input as Omit<DeclarationListOptions, 'nodeKind'>
      : { children: input } as Omit<DeclarationListOptions, 'nodeKind'>;
    const b = new DeclarationListBuilder();
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'const_item': return const_.from(_v);   case 'macro_invocation': return macro_invocation.from(_v);   case 'macro_definition': return macro_definition.from(_v);   case 'attribute_item': return attribute.from(_v);   case 'inner_attribute_item': return inner_attribute.from(_v);   case 'mod_item': return mod.from(_v);   case 'foreign_mod_item': return foreign_mod.from(_v);   case 'struct_item': return struct_.from(_v);   case 'union_item': return union.from(_v);   case 'enum_item': return enum_.from(_v);   case 'type_item': return type_.from(_v);   case 'function_item': return function_.from(_v);   case 'function_signature_item': return function_signature.from(_v);   case 'impl_item': return impl.from(_v);   case 'trait_item': return trait.from(_v);   case 'associated_type': return associated_type.from(_v);   case 'let_declaration': return let_declaration.from(_v);   case 'use_declaration': return use_declaration.from(_v);   case 'extern_crate_declaration': return extern_crate_declaration.from(_v);   case 'static_item': return static_.from(_v); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
