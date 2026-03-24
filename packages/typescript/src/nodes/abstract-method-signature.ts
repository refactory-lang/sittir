import { Builder, LeafBuilder } from '@sittir/types';
import type { RenderContext, CSTChild, LeafOptions } from '@sittir/types';
import type { AbstractMethodSignature, AccessibilityModifier, AssertsAnnotation, ComputedPropertyName, FormalParameters, Number, OverrideModifier, PrivatePropertyIdentifier, PropertyIdentifier, String, TypeAnnotation, TypeParameters, TypePredicateAnnotation } from '../types.js';
import { string } from './string.js';
import type { StringOptions } from './string.js';
import { computed_property_name } from './computed-property-name.js';
import type { ComputedPropertyNameOptions } from './computed-property-name.js';
import { type_parameters } from './type-parameters.js';
import type { TypeParametersOptions } from './type-parameters.js';
import { formal_parameters } from './formal-parameters.js';
import type { FormalParametersOptions } from './formal-parameters.js';
import { type_annotation } from './type-annotation.js';
import type { TypeAnnotationOptions } from './type-annotation.js';
import { asserts_annotation } from './asserts-annotation.js';
import type { AssertsAnnotationOptions } from './asserts-annotation.js';
import { type_predicate_annotation } from './type-predicate-annotation.js';
import type { TypePredicateAnnotationOptions } from './type-predicate-annotation.js';


class AbstractMethodSignatureBuilder extends Builder<AbstractMethodSignature> {
  private _name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
  private _typeParameters?: Builder<TypeParameters>;
  private _parameters!: Builder<FormalParameters>;
  private _returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>;
  private _children: Builder<AccessibilityModifier | OverrideModifier>[] = [];

  constructor(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>) {
    super();
    this._name = name;
  }

  typeParameters(value: Builder<TypeParameters>): this {
    this._typeParameters = value;
    return this;
  }

  parameters(value: Builder<FormalParameters>): this {
    this._parameters = value;
    return this;
  }

  returnType(value: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation>): this {
    this._returnType = value;
    return this;
  }

  children(...value: Builder<AccessibilityModifier | OverrideModifier>[]): this {
    this._children = value;
    return this;
  }

  renderImpl(ctx?: RenderContext): string {
    const parts: string[] = [];
    if (this._children[0]) parts.push(this.renderChild(this._children[0]!, ctx));
    parts.push('abstract');
    if (this._children[1]) parts.push(this.renderChild(this._children[1]!, ctx));
    if (this._name) parts.push(this.renderChild(this._name, ctx));
    if (this._typeParameters) parts.push(this.renderChild(this._typeParameters, ctx));
    if (this._parameters) parts.push(this.renderChild(this._parameters, ctx));
    if (this._returnType) parts.push(this.renderChild(this._returnType, ctx));
    return parts.join(' ');
  }

  build(ctx?: RenderContext): AbstractMethodSignature {
    return {
      kind: 'abstract_method_signature',
      name: this._name.build(ctx),
      typeParameters: this._typeParameters ? this._typeParameters.build(ctx) : undefined,
      parameters: this._parameters ? this._parameters.build(ctx) : undefined,
      returnType: this._returnType ? this._returnType.build(ctx) : undefined,
      children: this._children.map(c => c.build(ctx)),
    } as AbstractMethodSignature;
  }

  override get nodeKind(): 'abstract_method_signature' { return 'abstract_method_signature'; }

  override toCSTChildren(ctx?: RenderContext): CSTChild[] {
    const parts: CSTChild[] = [];
    if (this._children[0]) parts.push({ kind: 'builder', builder: this._children[0]! });
    parts.push({ kind: 'token', text: 'abstract', type: 'abstract' });
    if (this._children[1]) parts.push({ kind: 'builder', builder: this._children[1]! });
    if (this._name) parts.push({ kind: 'builder', builder: this._name, fieldName: 'name' });
    if (this._typeParameters) parts.push({ kind: 'builder', builder: this._typeParameters, fieldName: 'typeParameters' });
    if (this._parameters) parts.push({ kind: 'builder', builder: this._parameters, fieldName: 'parameters' });
    if (this._returnType) parts.push({ kind: 'builder', builder: this._returnType, fieldName: 'returnType' });
    return parts;
  }
}

export type { AbstractMethodSignatureBuilder };

export function abstract_method_signature(name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>): AbstractMethodSignatureBuilder {
  return new AbstractMethodSignatureBuilder(name);
}

export interface AbstractMethodSignatureOptions {
  nodeKind: 'abstract_method_signature';
  name: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName> | StringOptions | ComputedPropertyNameOptions;
  typeParameters?: Builder<TypeParameters> | Omit<TypeParametersOptions, 'nodeKind'>;
  parameters: Builder<FormalParameters> | Omit<FormalParametersOptions, 'nodeKind'>;
  returnType?: Builder<TypeAnnotation | AssertsAnnotation | TypePredicateAnnotation> | TypeAnnotationOptions | AssertsAnnotationOptions | TypePredicateAnnotationOptions;
  children?: Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'> | (Builder<AccessibilityModifier | OverrideModifier> | LeafOptions<'accessibility_modifier'> | LeafOptions<'override_modifier'>)[];
}

export namespace abstract_method_signature {
  export function from(options: Omit<AbstractMethodSignatureOptions, 'nodeKind'>): AbstractMethodSignatureBuilder {
    const _raw = options.name;
    let _ctor: Builder<PropertyIdentifier | PrivatePropertyIdentifier | String | Number | ComputedPropertyName>;
    if (_raw instanceof Builder) {
      _ctor = _raw;
    } else {
      switch (_raw.nodeKind) {
        case 'string': _ctor = string.from(_raw); break;
        case 'computed_property_name': _ctor = computed_property_name.from(_raw); break;
        default: throw new Error('unreachable');
      }
    }
    const b = new AbstractMethodSignatureBuilder(_ctor);
    if (options.typeParameters !== undefined) {
      const _v = options.typeParameters;
      b.typeParameters(_v instanceof Builder ? _v : type_parameters.from(_v));
    }
    if (options.parameters !== undefined) {
      const _v = options.parameters;
      b.parameters(_v instanceof Builder ? _v : formal_parameters.from(_v));
    }
    if (options.returnType !== undefined) {
      const _v = options.returnType;
      if (_v instanceof Builder) {
        b.returnType(_v);
      } else {
        switch (_v.nodeKind) {
          case 'type_annotation': b.returnType(type_annotation.from(_v)); break;
          case 'asserts_annotation': b.returnType(asserts_annotation.from(_v)); break;
          case 'type_predicate_annotation': b.returnType(type_predicate_annotation.from(_v)); break;
        }
      }
    }
    if (options.children !== undefined) {
      const _v = options.children;
      const _arr = Array.isArray(_v) ? _v : [_v];
      b.children(..._arr.map(_v => { if (_v instanceof Builder) return _v; switch (_v.nodeKind) {   case 'accessibility_modifier': return new LeafBuilder('accessibility_modifier', (_v as LeafOptions).text!);   case 'override_modifier': return new LeafBuilder('override_modifier', (_v as LeafOptions).text ?? 'override'); } throw new Error('unreachable'); }));
    }
    return b;
  }
}
